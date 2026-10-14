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
    private const STATUS_NAMES = [0 => 'WAITING', 1 => 'IN_CALL', 2 => '已结束'];

    /** 状态码 → 展示文案 */
    private const STATUS_LABELS = [0 => '待接诊', 1 => '会诊中', 2 => '已结束'];

    public function __construct(private readonly ConsultRtcService $rtc)
    {
    }

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
                'name' => ConsultationService::displayPatientName($session->patient_name),
                'gender' => $this->genderName($session->patient_gender),
                'age' => (int) $session->patient_age,
                'chiefComplaint' => $session->chief_complaint,
            ],
            'participants' => $this->participantsOf($session),
            'media' => [
                'mediaMode' => $room->media_mode,
                'rtcUrl' => $room->rtc_url,
                'rtcReady' => $room->rtcReady(),
                'notice' => $room->rtcReady() ? '' : '演示环境 · 音视频为占位，非商用 RTC',
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

        // 关闭远程会诊系统的音视频房间，并先把参会人留痕写回主系统
        $this->closeRtcRoom($room);

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
     * 关闭远程会诊系统的音视频房间
     *
     * 会诊系统为内存态，房间关闭后参会人即不可查，因此必须先抓参会人留痕再关房间。
     * 任一步失败不影响主系统的会诊结论与状态流转。
     */
    private function closeRtcRoom(ConsultRoom $room): void
    {
        if (! $room->rtcReady()) {
            return;
        }

        // 房主（接诊医生/指定医生）记为主讲医生，其余记参会专家
        $session = $room->session;
        $ownerId = $session?->accepted_by ?: $session?->nominated_doctor_id;
        $ownerName = $session?->accepted_by_name;

        foreach ($this->rtc->participants((string) $room->rtc_session_id) as $p) {
            if (($p['displayName'] ?? '') === '') {
                continue;
            }
            $isOwner = ($ownerId && ($p['userId'] ?? '') === $ownerId)
                || ($ownerName && $p['displayName'] === $ownerName);

            ConsultParticipant::firstOrCreate(
                ['session_id' => $room->session_id, 'name' => $p['displayName']],
                [
                    'role' => $isOwner ? '主讲医生' : '参会专家',
                    'online' => false,
                    'device_type' => null,
                    'join_mode' => 'link',
                    'joined_at' => now(),
                ]
            );
        }

        $this->rtc->endRoom($room);
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
