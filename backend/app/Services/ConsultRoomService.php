<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\ConsultOpinion;
use App\Models\ConsultParticipant;
use App\Models\ConsultRoom;

/**
 * 会诊室：房间信息、临床资料、会诊意见、患者入会（按 consult_rooms.token 定位）
 */
class ConsultRoomService extends Service
{
    /** 状态码 → 常量名 */
    private const STATUS_NAMES = [0 => 'WAITING', 1 => 'IN_CALL', 2 => 'FINISHED'];

    /** 状态码 → 展示文案 */
    private const STATUS_LABELS = [0 => '待接诊', 1 => '会诊中', 2 => '已结束'];

    /**
     * 会诊室信息（§5.6）
     */
    public function show(string $token): array
    {
        $room = $this->findRoom($token);
        $session = $room->session;

        return [
            'token' => $room->token,
            'consultCode' => $room->consult_code,
            'sessionId' => $room->session_id,
            'roomName' => $room->room_name,
            'patient' => [
                'patientId' => $room->patient_id,
                'name' => $session->patient_name,
                'gender' => $this->genderName($session->patient_gender),
                'age' => (int) $session->patient_age,
                'chiefComplaint' => $session->chief_complaint,
            ],
            'participants' => $this->participantsOf($session),
            'media' => [
                'mediaMode' => $room->media_mode,
                'rtcUrl' => $room->rtc_url,
                'notice' => '演示环境 · 音视频为占位，非商用 RTC',
            ],
            'status' => self::STATUS_NAMES[$room->status] ?? 'UNKNOWN',
            'statusLabel' => self::STATUS_LABELS[$room->status] ?? '',
            'openedAt' => optional($room->opened_at)->toIso8601String(),
        ];
    }

    /**
     * 临床资料（§5.7）
     */
    public function materials(string $token, ?string $kind): array
    {
        $room = $this->findRoom($token);

        $materials = $room->materials()
            ->when($kind, fn ($q, $v) => $q->where('kind', $v))
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => [
                'id' => (string) $m->id,
                'kind' => $m->kind,
                'title' => $m->title,
                'content' => $m->content,
                'source' => $m->source,
                'authorName' => $m->author_name,
                'sharedAt' => optional($m->shared_at)->toIso8601String(),
            ])->all();

        return ['materials' => $materials];
    }

    /**
     * 提交会诊意见（§5.8，提交后状态流转为已结束）
     */
    public function opinions(string $token, array $data): array
    {
        $room = $this->findRoom($token);
        $session = $room->session;

        $content = trim($data['content'] ?? '');
        $this->assert($content !== '', ResponseCode::BAD_REQUEST, '会诊意见不能为空');
        $this->assert(! empty($session->accepted_by), ResponseCode::CONFLICT, '请先由具体医生接诊');

        $now = now();
        $opinion = ConsultOpinion::create([
            'room_token' => $room->token,
            'session_id' => $room->session_id,
            'doctor_id' => $session->accepted_by,
            'doctor_name' => $session->accepted_by_name ?? '',
            'content' => $content,
            'submitted_at' => $now,
        ]);

        $session->update(['status' => 2, 'closed_at' => $now]);
        $room->update(['status' => 2, 'closed_at' => $now]);

        return [
            'opinionId' => (string) $opinion->id,
            'sessionId' => $room->session_id,
            'doctorName' => $opinion->doctor_name,
            'status' => 'FINISHED',
            'statusLabel' => '已结束',
            'submittedAt' => $now->toIso8601String(),
            'closedAt' => $now->toIso8601String(),
        ];
    }

    /**
     * 患者 / 家属入会（§5.9）
     */
    public function join(string $token, array $data): array
    {
        $room = $this->findRoom($token);

        $now = now();
        $participant = ConsultParticipant::create([
            'session_id' => $room->session_id,
            'role' => $data['role'],
            'name' => $data['name'],
            'online' => true,
            'device_type' => $data['deviceType'] ?? null,
            'join_mode' => $data['joinMode'] ?? null,
            'joined_at' => $now,
        ]);

        return [
            'joined' => true,
            'participantId' => (string) $participant->id,
            'roomToken' => $room->token,
            'joinedAt' => $now->toIso8601String(),
        ];
    }

    /**
     * 按 token 取会诊室（含会话）
     */
    private function findRoom(string $token): ConsultRoom
    {
        $room = ConsultRoom::with('session.participants')->where('token', $token)->first();
        $this->assert($room !== null && $room->session !== null, ResponseCode::NOT_FOUND, '会诊室不存在或 token 无效');

        return $room;
    }

    private function participantsOf($session): array
    {
        return $session->participants->map(fn ($p) => [
            'role' => $p->role,
            'name' => $p->name,
            'online' => (bool) $p->online,
        ])->values()->all();
    }

    private function genderName(int $gender): string
    {
        return $gender === 1 ? 'FEMALE' : 'MALE';
    }
}
