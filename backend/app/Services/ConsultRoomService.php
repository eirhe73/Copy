<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\ConsultOpinion;
use App\Models\ConsultParticipant;
use App\Models\ConsultSession;

/**
 * 会诊室：房间信息、临床资料、会诊意见、患者入会
 */
class ConsultRoomService extends Service
{
    /**
     * 会诊室信息
     */
    public function room(string $token): array
    {
        $session = $this->findSession($token);

        return [
            'token' => $session->token,
            'consultCode' => $session->consult_code,
            'sessionId' => $session->session_id,
            'roomName' => trim($session->patient_name.' · '.$session->hospital.' · '.$session->department, ' ·'),
            'patient' => [
                'patientId' => $session->patient_id,
                'name' => $session->patient_name,
                'gender' => $session->patient_gender === 1 ? 'FEMALE' : 'MALE',
                'age' => (int) $session->patient_age,
                'chiefComplaint' => $session->chief_complaint,
            ],
            'participants' => $session->participants->map(fn ($p) => [
                'role' => $p->role,
                'name' => $p->name,
                'online' => (bool) $p->online,
            ])->values()->all(),
            'media' => [
                'mediaMode' => 'PLACEHOLDER',
                'rtcUrl' => null,
                'notice' => '演示环境 · 音视频为占位，非商用 RTC',
            ],
            'status' => [0 => 'WAITING', 1 => 'IN_CALL', 2 => 'FINISHED'][$session->status] ?? 'UNKNOWN',
            'statusLabel' => [0 => '待接诊', 1 => '会诊中', 2 => '已结束'][$session->status] ?? '',
            'openedAt' => optional($session->opened_at)->toIso8601String(),
        ];
    }

    /**
     * 临床资料
     */
    public function materials(string $token, ?string $kind): array
    {
        $session = $this->findSession($token);

        $materials = $session->materials()
            ->when($kind, fn ($q, $v) => $q->where('kind', $v))
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->material_no,
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
     * 提交会诊意见（提交后状态流转为已结束）
     */
    public function submitOpinion(string $token, array $data): array
    {
        $session = $this->findSession($token);

        $content = trim($data['content'] ?? '');
        $this->assert($content !== '', ResponseCode::BAD_REQUEST, '会诊意见不能为空');
        $this->assert(! empty($session->accepted_by), ResponseCode::CONFLICT, '请先由具体医生接诊');

        $now = now();
        $opinion = ConsultOpinion::create([
            'opinion_no' => $this->nextOpinionNo(),
            'session_id' => $session->session_id,
            'content' => $content,
            'doctor_id' => $session->accepted_by,
            'doctor_name' => $session->accepted_by_name ?? '',
            'submitted_at' => $now,
        ]);

        $session->update(['status' => 2, 'closed_at' => $now]);

        return [
            'opinionId' => $opinion->opinion_no,
            'sessionId' => $session->session_id,
            'doctorName' => $opinion->doctor_name,
            'status' => 'FINISHED',
            'statusLabel' => '已结束',
            'submittedAt' => $now->toIso8601String(),
            'closedAt' => $now->toIso8601String(),
        ];
    }

    /**
     * 患者 / 家属入会
     */
    public function join(string $token, array $data): array
    {
        $session = $this->findSession($token);

        $now = now();
        $participant = ConsultParticipant::create([
            'session_id' => $session->session_id,
            'role' => $data['role'],
            'name' => $data['name'],
            'online' => true,
            'device_type' => $data['deviceType'] ?? null,
            'join_mode' => $data['joinMode'] ?? null,
            'joined_at' => $now,
        ]);

        return [
            'joined' => true,
            'participantId' => $participant->id,
            'roomToken' => $token,
            'joinedAt' => $now->toIso8601String(),
        ];
    }

    /**
     * 按 token 取会诊会话
     */
    private function findSession(string $token): ConsultSession
    {
        $session = ConsultSession::with('participants')->where('token', $token)->first();
        $this->assert($session !== null, ResponseCode::NOT_FOUND, '会诊室不存在或 token 无效');

        return $session;
    }

    /**
     * 生成意见编号：OPI-{四位序号}
     */
    private function nextOpinionNo(): string
    {
        $seq = 1000 + ConsultOpinion::count() + 1;

        return 'OPI-'.$seq;
    }
}
