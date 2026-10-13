<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\ConsultSession;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * 远程会诊：会诊队列、发起会诊、接诊、详情与会诊室会话编排
 */
class ConsultationService extends Service
{
    /** 状态码 → 常量名 */
    private const STATUS_NAMES = [0 => 'WAITING', 1 => 'IN_CALL', 2 => 'FINISHED'];

    /** 状态码 → 展示文案 */
    private const STATUS_LABELS = [0 => '待接诊', 1 => '会诊中', 2 => '已结束'];

    /**
     * 会诊队列（默认待接诊）
     */
    public function queue(array $params): array
    {
        $query = ConsultSession::query()
            ->with('participants')
            ->whereIn('status', $this->parseStatuses($params['status'] ?? 'WAITING'));

        $query->when($params['institutionId'] ?? null, fn ($q, $v) => $q->where('hospital', $v))
            ->when($params['departmentId'] ?? null, fn ($q, $v) => $q->where('department', $v))
            ->when($params['keyword'] ?? null, function ($q, $v) {
                $q->where(function ($sub) use ($v) {
                    $sub->where('patient_name', 'like', "%{$v}%")
                        ->orWhere('session_id', 'like', "%{$v}%");
                });
            });

        $pageNum = max(1, (int) ($params['pageNum'] ?? 1));
        $pageSize = max(1, (int) ($params['pageSize'] ?? 20));
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('created_at')->forPage($pageNum, $pageSize)->get();

        $nominatedNames = $this->userNames($rows->pluck('nominated_doctor_id')->all());

        return [
            'total' => $total,
            'list' => $rows->map(fn (ConsultSession $s) => $this->queueItem($s, $nominatedNames))->all(),
        ];
    }

    /**
     * 发起会诊
     */
    public function create(array $data): array
    {
        $patientId = $data['patientId'] ?? null;
        $patientName = $data['patientName'] ?? '';
        $chiefComplaint = $data['chiefComplaint'] ?? '';
        $gender = $data['gender'] ?? null;
        $age = (int) ($data['age'] ?? 0);

        if (! empty($patientId)) {
            $patient = Patient::where('patient_code', $patientId)->first();
            if ($patient) {
                $patientName = $patient->real_name;
                $gender = $gender ?: $patient->gender;
                $age = $age ?: (int) $patient->age;
            }
        }

        $duplicated = ConsultSession::whereIn('status', [0, 1])
            ->when($patientId, fn ($q) => $q->where('patient_id', $patientId))
            ->when(empty($patientId), fn ($q) => $q->where('patient_name', $patientName))
            ->exists();
        $this->assert(! $duplicated, ResponseCode::CONFLICT, '该患者已存在待接诊或会诊中的申请');

        $token = $data['token'] ?? (string) Str::uuid();

        $session = ConsultSession::create([
            'session_id' => $this->nextSessionId(),
            'token' => $token,
            'consult_code' => substr($token, 0, 6),
            'mode' => 'standalone',
            'compatible120' => false,
            'patient_id' => $patientId,
            'patient_name' => $patientName,
            'patient_gender' => $this->genderCode($gender),
            'patient_age' => $age,
            'chief_complaint' => $chiefComplaint,
            'source_hospital' => $data['sourceHospital'] ?? '',
            'source_department' => $data['sourceDepartment'] ?? '',
            'hospital' => $data['targetHospital'],
            'department' => $data['targetDepartment'],
            'nominated_doctor_id' => $data['nominatedDoctorId'] ?? null,
            'note' => $data['note'] ?? '',
            'status' => 0,
        ]);

        return [
            'sessionId' => $session->session_id,
            'token' => $session->token,
            'consultCode' => $session->consult_code,
            'consultLink' => rtrim(request()->root(), '/').'/#/room/'.$session->token,
            'status' => self::STATUS_NAMES[0],
            'statusLabel' => self::STATUS_LABELS[0],
        ];
    }

    /**
     * 入院会诊会话（最近一条待接诊/会诊中）
     */
    public function admission(): ?array
    {
        $session = ConsultSession::with('participants')
            ->whereIn('status', [0, 1])
            ->orderByDesc('id')
            ->first();

        if ($session === null) {
            return null;
        }

        return [
            'sessionId' => $session->session_id,
            'mode' => $session->mode,
            'compatible120' => (bool) $session->compatible120,
            'patient' => $this->patientOf($session) + ['task120Id' => $session->task120_id],
            'hospital' => $session->hospital,
            'department' => $session->department,
            'status' => self::STATUS_NAMES[$session->status] ?? 'UNKNOWN',
            'statusLabel' => self::STATUS_LABELS[$session->status] ?? '',
            'participants' => $this->participantsOf($session),
        ];
    }

    /**
     * 会诊详情
     */
    public function detail(string $sessionId): array
    {
        $session = ConsultSession::with('participants')->where('session_id', $sessionId)->first();
        $this->assert($session !== null, ResponseCode::NOT_FOUND, '会诊会话不存在');

        return [
            'sessionId' => $session->session_id,
            'token' => $session->token,
            'consultCode' => $session->consult_code,
            'patient' => ['patientId' => $session->patient_id] + $this->patientOf($session),
            'sourceHospital' => $session->source_hospital,
            'sourceDepartment' => $session->source_department,
            'targetHospital' => $session->hospital,
            'targetDepartment' => $session->department,
            'participants' => $this->participantsOf($session),
            'status' => self::STATUS_NAMES[$session->status] ?? 'UNKNOWN',
            'statusLabel' => self::STATUS_LABELS[$session->status] ?? '',
            'room' => ['token' => $session->token, 'mediaMode' => 'PLACEHOLDER'],
            'opinionSummary' => (string) ($session->opinions()->orderByDesc('id')->value('content') ?? ''),
            'createdAt' => optional($session->created_at)->toIso8601String(),
            'acceptedAt' => optional($session->accepted_at)->toIso8601String(),
        ];
    }

    /**
     * 可选接诊医生（基于 users 医生账号组装）
     */
    public function doctors(array $params): array
    {
        if (! empty($params['departmentId'])) {
            // users 表无科室归属列，无法按科室过滤
            return ['doctors' => []];
        }

        $query = User::query()->with('organization')->where('identity_type', 'DOCTOR');
        $query->when($params['institutionId'] ?? null, function ($q, $v) {
            $q->where(function ($sub) use ($v) {
                $sub->where('org_id', $v)
                    ->orWhereHas('organization', fn ($o) => $o->where('org_code', $v));
            });
        })->when($params['keyword'] ?? null, fn ($q, $v) => $q->where('real_name', 'like', "%{$v}%"));

        $doctors = $query->orderByDesc('id')->limit(100)->get()->map(fn (User $user) => [
            'doctorId' => $user->username,
            'name' => $user->real_name,
            'profession' => 'doctor',
            'institutionId' => $user->organization->org_code ?? '',
            'institutionName' => $user->organization->org_name ?? '',
            'departmentId' => '',
            'departmentName' => '',
            'online' => false,
        ])->all();

        return ['doctors' => $doctors];
    }

    /**
     * 医生接诊（仅待接诊可接）
     */
    public function accept(string $sessionId, array $data): array
    {
        $session = ConsultSession::where('session_id', $sessionId)->first();
        $this->assert($session !== null, ResponseCode::NOT_FOUND, '会诊申请不存在');
        $this->assert($session->status === 0, ResponseCode::CONFLICT, '该会诊已被接诊，不能重复领取');

        $doctorId = $data['doctorId'] ?? null;
        if (empty($doctorId)) {
            $user = auth()->user();
            $doctorId = $user?->username ?? 'unknown';
            $doctorName = $user?->real_name;
        } else {
            $doctorName = User::where('username', $doctorId)->value('real_name');
        }
        $doctorName = $doctorName ?: $doctorId;

        $now = now();
        $session->update([
            'accepted_by' => $doctorId,
            'accepted_by_name' => $doctorName,
            'accepted_at' => $now,
            'opened_at' => $now,
            'status' => 1,
        ]);

        return [
            'sessionId' => $session->session_id,
            'status' => self::STATUS_NAMES[1],
            'statusLabel' => self::STATUS_LABELS[1],
            'acceptedBy' => $doctorId,
            'acceptedByName' => $doctorName,
            'acceptedAt' => $now->toIso8601String(),
            'openedAt' => $now->toIso8601String(),
        ];
    }

    /**
     * status 参数（可逗号分隔常量名）解析为状态码
     */
    private function parseStatuses(string $status): array
    {
        $map = array_flip(self::STATUS_NAMES);
        $codes = [];
        foreach (explode(',', $status) as $name) {
            $name = strtoupper(trim($name));
            if (isset($map[$name])) {
                $codes[] = $map[$name];
            }
        }

        return $codes ?: [0];
    }

    /**
     * 生成会诊会话编号：consult-{Ymd}-{三位序号}
     */
    private function nextSessionId(): string
    {
        $prefix = 'consult-'.now()->format('Ymd').'-';
        $count = ConsultSession::where('session_id', 'like', $prefix.'%')->count();

        return $prefix.str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);
    }

    /**
     * 患者基础信息（不含患者编号）
     */
    private function patientOf(ConsultSession $session): array
    {
        return [
            'name' => $session->patient_name,
            'gender' => $this->genderName($session->patient_gender),
            'age' => (int) $session->patient_age,
            'chiefComplaint' => $session->chief_complaint,
        ];
    }

    /**
     * 队列条目
     */
    private function queueItem(ConsultSession $session, array $nominatedNames): array
    {
        $applicant = $session->participants->firstWhere('role', '发起医生')
            ?? $session->participants->first();

        return [
            'sessionId' => $session->session_id,
            'token' => $session->token,
            'consultCode' => $session->consult_code,
            'patient' => [
                'patientId' => $session->patient_id,
                'name' => $session->patient_name,
                'gender' => $this->genderName($session->patient_gender),
                'age' => (int) $session->patient_age,
                'chiefComplaint' => $session->chief_complaint,
                'symptoms' => [],
            ],
            'sourceHospital' => $session->source_hospital,
            'sourceDepartment' => $session->source_department,
            'targetHospital' => $session->hospital,
            'targetDepartment' => $session->department,
            'applicantName' => $applicant->name ?? '',
            'nominatedDoctorName' => $nominatedNames[$session->nominated_doctor_id] ?? '',
            'status' => self::STATUS_NAMES[$session->status] ?? 'UNKNOWN',
            'statusLabel' => self::STATUS_LABELS[$session->status] ?? '',
            'createdAt' => optional($session->created_at)->toIso8601String(),
        ];
    }

    private function participantsOf(ConsultSession $session): array
    {
        return $session->participants->map(fn ($p) => [
            'role' => $p->role,
            'name' => $p->name,
            'online' => (bool) $p->online,
        ])->values()->all();
    }

    /**
     * 批量取医生姓名（以 username 为键）
     */
    private function userNames(array $usernames): array
    {
        $usernames = array_values(array_filter($usernames));
        if ($usernames === []) {
            return [];
        }

        return User::whereIn('username', $usernames)->pluck('real_name', 'username')->all();
    }

    private function genderName(int $gender): string
    {
        return $gender === 1 ? 'FEMALE' : 'MALE';
    }

    private function genderCode(?string $gender): int
    {
        return in_array($gender, ['FEMALE', 'GENDER_FEMALE'], true) ? 1 : 0;
    }
}
