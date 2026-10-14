<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\ConsultRoom;
use App\Models\ConsultSession;
use App\Models\Department;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * 远程会诊：会诊队列、发起会诊、接诊、详情与会诊室会话编排
 */
class ConsultationService extends Service
{
    /** 单次请求最多探活几个音视频房间 */
    private const RTC_PROBE_LIMIT = 8;

    /** 状态码 → 常量名 */
    private const STATUS_NAMES = [0 => 'WAITING', 1 => 'IN_CALL', 2 => 'FINISHED'];

    /** 状态码 → 展示文案 */
    private const STATUS_LABELS = [0 => '待接诊', 1 => '会诊中', 2 => '已结束'];

    public function __construct(
        private readonly ConsultRtcService $rtc,
        private readonly ConsultRoomService $rooms,
    ) {
    }

    /**
     * 会诊队列（§5.1，默认待接诊）
     */
    public function index(array $params): array
    {
        $query = ConsultSession::query()
            ->with(['participants', 'room'])
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

        // 对账：音视频房间已在会诊系统侧结束的，收口为"已结束"（会诊系统不反向回调）
        $this->reconcileRtcClosed($rows);

        $nominatedNames = $this->userNames($rows->pluck('nominated_doctor_id')->all());

        return [
            'total' => $total,
            'list' => $rows->map(fn (ConsultSession $s) => $this->queueItem($s, $nominatedNames))->all(),
        ];
    }

    /**
     * 音视频房间已结束对账
     *
     * 会诊系统是单向依赖（不反向回调主系统），所以主系统只能在读队列/详情时主动探活：
     * 房间 state=ENDED 说明房主已在会诊室点"关闭房间"，据此把会诊单收口为"已结束"。
     *
     * 只认明确的 ENDED：房间 404（会诊系统重启导致内存态丢失）不代表会诊结束，不能据此关单，
     * 那种情况由下次入会时按同一 consultId 重建房间兜底。
     */
    private function reconcileRtcClosed($rows): void
    {
        if (! $this->rtc->enabled()) {
            return;
        }

        $candidates = $rows
            ->filter(fn (ConsultSession $s) => in_array((int) $s->status, [0, 1], true)
                && $s->room !== null
                && $s->room->rtcReady()
                && (int) $s->room->rtc_sync_status === ConsultRtcService::SYNC_OK)
            // 会诊中的优先对账，且限制探活个数：探活是跨系统 HTTP 调用，队列页不宜无上限外呼
            ->sortByDesc(fn (ConsultSession $s) => (int) $s->status === 1)
            ->take(self::RTC_PROBE_LIMIT);

        foreach ($candidates as $session) {
            $state = $this->rtc->roomState((string) $session->room->rtc_session_id);

            if ($state === 'ENDED') {
                $this->rooms->closeByRtc($session->room);
                // closeByRtc 内部操作的是 room->session（另一个模型实例），
                // 这里让调用方持有的实例同步刷新，否则详情/入院会话会返回过期状态
                $session->refresh();
                continue;
            }

            // 会诊系统不可达：本次不再继续探活，避免队列请求被跨系统超时拖慢
            if ($state === null) {
                break;
            }
        }
    }

    /**
     * 发起会诊（§5.3，同步创建会诊室）
     */
    public function store(array $data): array
    {
        $patientId = $data['patientId'] ?? null;
        $patientName = $data['patientName'] ?? '';
        $chiefComplaint = $data['chiefComplaint'] ?? '';
        $gender = $data['gender'] ?? null;
        $age = (int) ($data['age'] ?? 0);

        $patient = null;
        if (! empty($patientId)) {
            $patient = Patient::where('patient_id', $patientId)->first();
            if ($patient) {
                $patientName = $patient->name;
                $gender = $gender ?: $patient->gender;
                $age = $age ?: (int) $patient->age;
            }
        }

        // 未知患者（空名/？？？？/无名氏）统一以"临时患者"入账，
        // 会诊队列、会诊室名与推给会诊系统的患者信息保持一致
        $patientName = self::displayPatientName($patientName);

        $duplicated = ConsultSession::whereIn('status', [0, 1])
            ->when($patientId, fn ($q) => $q->where('patient_id', $patientId))
            ->when(empty($patientId), fn ($q) => $q->where('patient_name', $patientName))
            ->exists();
        $this->assert(! $duplicated, ResponseCode::CONFLICT, '该患者已存在待接诊或会诊中的申请');

        $token = $data['token'] ?? (string) Str::uuid();
        $consultCode = substr($token, 0, 6);
        $sessionId = $this->nextSessionId();
        $hospital = $data['targetHospital'];
        $department = $data['targetDepartment'];

        $session = ConsultSession::create([
            'session_id' => $sessionId,
            'token' => $token,
            'consult_code' => $consultCode,
            'mode' => 'standalone',
            'compatible120' => false,
            'patient_id' => $patientId,
            'patient_name' => $patientName,
            'patient_gender' => $this->genderCode($gender),
            'patient_age' => $age,
            'chief_complaint' => $chiefComplaint,
            'source_hospital' => $data['sourceHospital'] ?? '',
            'source_department' => $data['sourceDepartment'] ?? '',
            'hospital' => $hospital,
            'department' => $department,
            'nominated_doctor_id' => $data['nominatedDoctorId'] ?? null,
            'note' => $data['note'] ?? '',
            'scheduled_at' => $data['scheduledAt'] ?? null,
            'status' => 0,
        ]);

        $room = ConsultRoom::create([
            'token' => $token,
            'consult_code' => $consultCode,
            'session_id' => $sessionId,
            'patient_id' => $patientId ?? '',
            'room_name' => trim($patientName.' · '.$hospital.' · '.$department, ' ·'),
            'media_mode' => 'PLACEHOLDER',
            'status' => 0,
        ]);

        // 定时未到点：不创建音视频房间。会诊系统的房间是内存态（WAITING 30 分钟自动回收），
        // 提前创建必然被回收；到点后首次点"进入会诊室"时由 joinLink 的 ensureRoom 按需创建。
        // 立即会诊：同步创建，失败不阻断，房间标记 rtc_sync_status=2 由补偿任务重推。
        // $patient 复用上面查到的结果，避免对远程库重复查询。
        if ($this->startable($session)) {
            $this->rtc->createRoom($session, $room, $this->operatorName(), $patient);
        }

        return [
            'sessionId' => $session->session_id,
            'token' => $token,
            'consultCode' => $consultCode,
            'consultLink' => $room->rtc_url ?: rtrim(request()->root(), '/').'/#/room/'.$token,
            'mediaMode' => $room->media_mode,
            'rtcReady' => $room->rtcReady(),
            'scheduledAt' => optional($session->scheduled_at)->toIso8601String(),
            'startable' => $this->startable($session),
            'status' => self::STATUS_NAMES[0],
            'statusLabel' => self::STATUS_LABELS[0],
        ];
    }

    /**
     * 会诊是否已到可开始时间：未定时时始终可开始
     */
    private function startable(ConsultSession $session): bool
    {
        return $session->scheduled_at === null || now()->gte($session->scheduled_at);
    }

    /**
     * 入会链接：医生进入远程会诊系统的跳转地址
     *
     * 房主（接诊医生 / 指定医生 / 当前操作人）走一次性 ownerTicket；
     * 受邀专家走 joinToken。会诊系统重启导致房间丢失时，按同一 consultId 自动重建。
     */
    public function joinLink(string $sessionId, array $params): array
    {
        $session = ConsultSession::with('room')->where('session_id', $sessionId)->first();
        $this->assert($session !== null, ResponseCode::NOT_FOUND, '会诊会话不存在');

        $room = $session->room;
        $this->assert($room !== null, ResponseCode::NOT_FOUND, '会诊室不存在');

        // 定时会诊未到点：服务端强校验，前端隐藏按钮只是第一道防线
        // 具体开始时间由前端按浏览器时区展示，这里不带时间避免服务端时区歧义
        $this->assert(
            $this->startable($session),
            ResponseCode::CONFLICT,
            '会诊未到预定开始时间，不能进入会诊室'
        );

        [$doctorId, $doctorName] = $this->resolveDoctor($params['doctorId'] ?? null);

        // 房主判定：已接诊医生 → 指定医生 → 当前操作人
        $ownerId = $session->accepted_by ?: ($session->nominated_doctor_id ?: $doctorId);
        $isOwner = $ownerId === $doctorId;
        $role = $isOwner ? 'OWNER' : 'EXPERT';

        if (! $this->rtc->enabled()) {
            return $this->localJoinLink($sessionId, $room, $role);
        }

        // 兜底会诊系统内存态丢失（重启/房间过期）
        $this->rtc->ensureRoom($session, $room, $doctorName);
        $room->refresh();

        if (! $room->rtcReady()) {
            return $this->localJoinLink($sessionId, $room, $role);
        }

        $joinUrl = '';
        $expiresAt = null;

        if ($isOwner) {
            $ticket = $this->rtc->mintOwnerTicket($room);
            if ($ticket === null) {
                // 补签失败说明原会议已结束或被回收，重建后再签一次
                $this->rtc->createRoom($session, $room, $doctorName);
                $room->refresh();
                $ticket = $this->rtc->mintOwnerTicket($room);
            }
            if ($ticket !== null) {
                $joinUrl = $this->rtc->buildJoinUrl((string) $room->rtc_session_id, [
                    'ownerTicket' => $ticket,
                    'name' => $doctorName,
                    // 带上主系统医生标识，房主入会后参会记录可用 userId 与主系统对齐，避免同名串记录
                    'userId' => $doctorId,
                ]);
                $expiresAt = now()->addSeconds(60)->toIso8601String();
            }
        } else {
            $joinUrl = $this->rtc->buildJoinUrl((string) $room->rtc_session_id, [
                'token' => (string) $room->rtc_join_token,
                'name' => $doctorName,
                'userId' => $doctorId,
            ]);
        }

        if ($joinUrl === '') {
            return $this->localJoinLink($sessionId, $room, $role);
        }

        return [
            'sessionId' => $sessionId,
            'joinUrl' => $joinUrl,
            'role' => $role,
            'mediaMode' => $room->media_mode,
            'rtcReady' => true,
            'expiresAt' => $expiresAt,
        ];
    }

    /**
     * 本地占位会诊室链接（未对接或对接失败时使用）
     */
    private function localJoinLink(string $sessionId, ConsultRoom $room, string $role): array
    {
        return [
            'sessionId' => $sessionId,
            'joinUrl' => rtrim(request()->root(), '/').'/#/room/'.$room->token,
            'role' => $role,
            'mediaMode' => $room->media_mode,
            'rtcReady' => false,
            'expiresAt' => null,
        ];
    }

    /**
     * 解析医生标识：未传 doctorId 时取当前登录用户
     *
     * @return array{0:string, 1:string} [username, 姓名]
     */
    private function resolveDoctor(?string $doctorId): array
    {
        if (! empty($doctorId)) {
            return [$doctorId, User::where('username', $doctorId)->value('real_name') ?: $doctorId];
        }

        $user = auth()->user();
        $username = $user?->username ?? '';

        return [$username, $user?->real_name ?: ($username ?: '医生')];
    }

    /**
     * 当前操作人姓名（发起会诊时作为会议房主显示名）
     */
    private function operatorName(): string
    {
        $user = auth()->user();

        return $user?->real_name ?: ($user?->username ?: '医生');
    }

    /**
     * 入院会诊会话（§3.1，最近一条待接诊/会诊中）
     */
    public function admission(): ?array
    {
        $session = ConsultSession::with(['participants', 'room'])
            ->whereIn('status', [0, 1])
            ->orderByDesc('id')
            ->first();

        if ($session === null) {
            return null;
        }

        // 对账：音视频房间已结束的，收口为"已结束"
        $this->reconcileRtcClosed(collect([$session]));

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
     * 会诊详情（§5.2）
     */
    public function show(string $sessionId): array
    {
        $session = ConsultSession::with(['participants', 'room'])->where('session_id', $sessionId)->first();
        $this->assert($session !== null, ResponseCode::NOT_FOUND, '会诊会话不存在');

        // 对账：音视频房间已结束的，收口为"已结束"
        $this->reconcileRtcClosed(collect([$session]));

        $room = $session->room;

        return [
            'sessionId' => $session->session_id,
            'token' => $room->token ?? $session->token,
            'consultCode' => $room->consult_code ?? $session->consult_code,
            'patient' => ['patientId' => $session->patient_id] + $this->patientOf($session),
            'sourceHospital' => $session->source_hospital,
            'sourceDepartment' => $session->source_department,
            'targetHospital' => $session->hospital,
            'targetDepartment' => $session->department,
            'participants' => $this->participantsOf($session),
            'scheduledAt' => optional($session->scheduled_at)->toIso8601String(),
            'startable' => $this->startable($session),
            'status' => self::STATUS_NAMES[$session->status] ?? 'UNKNOWN',
            'statusLabel' => self::STATUS_LABELS[$session->status] ?? '',
            'room' => [
                'token' => $room->token ?? $session->token,
                'mediaMode' => $room->media_mode ?? 'PLACEHOLDER',
            ],
            'opinionSummary' => (string) ($session->opinions()->orderByDesc('id')->value('content') ?? ''),
            'createdAt' => optional($session->created_at)->toIso8601String(),
            'acceptedAt' => optional($session->accepted_at)->toIso8601String(),
        ];
    }

    /**
     * 可选接诊医生（§5.5，支持机构/科室过滤）
     */
    public function doctors(array $params): array
    {
        $query = User::query()->with('organization')->where('identity_type', 'DOCTOR');
        $query->when($params['institutionId'] ?? null, function ($q, $v) {
            $q->where(function ($sub) use ($v) {
                $sub->where('org_id', $v)
                    ->orWhereHas('organization', fn ($o) => $o->where('org_code', $v));
            });
        })->when($params['departmentId'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->when($params['keyword'] ?? null, fn ($q, $v) => $q->where('real_name', 'like', "%{$v}%"));

        $users = $query->orderByDesc('id')->limit(100)->get();
        $deptNames = $this->departmentNames($users->pluck('department_id')->all());

        $doctors = $users->map(fn (User $user) => [
            'doctorId' => $user->username,
            'name' => $user->real_name,
            'profession' => 'doctor',
            'institutionId' => $user->organization->org_code ?? '',
            'institutionName' => $user->organization->org_name ?? '',
            'departmentId' => $user->department_id ?? '',
            'departmentName' => $deptNames[$user->department_id] ?? '',
            'online' => false,
        ])->all();

        return ['doctors' => $doctors];
    }

    /**
     * 医生接诊（§5.4，仅待接诊可接）
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
        ConsultRoom::where('session_id', $sessionId)
            ->update(['status' => 1, 'opened_at' => $now]);

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
     * 未知患者展示名：空名/全问号/无名氏等身份不明姓名统一显示为"临时患者"
     *
     * 院前或车上登记时身份不明的患者，姓名常被填成"？？？？"，
     * 会诊队列等界面不得原样展示。
     */
    public static function displayPatientName(?string $name): string
    {
        $name = trim((string) $name);
        if ($name === '' || preg_match('/^[?？]+$/', $name) === 1) {
            return '临时患者';
        }

        return in_array($name, ['未知患者', '无名氏', '姓名不详', '名字不详', '不详'], true) ? '临时患者' : $name;
    }

    /**
     * 患者基础信息（不含患者编号）
     */
    private function patientOf(ConsultSession $session): array
    {
        return [
            'name' => self::displayPatientName($session->patient_name),
            'gender' => $this->genderName($session->patient_gender),
            'age' => (int) $session->patient_age,
            'chiefComplaint' => $session->chief_complaint,
        ];
    }

    /**
     * 队列条目（§5.1）
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
                'name' => self::displayPatientName($session->patient_name),
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
            'scheduledAt' => optional($session->scheduled_at)->toIso8601String(),
            'startable' => $this->startable($session),
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

    /**
     * 批量取科室名称（以 dept_code 为键）
     */
    private function departmentNames(array $codes): array
    {
        $codes = array_values(array_filter($codes));
        if ($codes === []) {
            return [];
        }

        return Department::whereIn('dept_code', $codes)->pluck('dept_name', 'dept_code')->all();
    }

    /**
     * 性别编码 → 接口名：0男 1女 2未知
     *
     * 原来只分"是1/不是1"，未知(2)会被报成 MALE，队列与详情把性别不明显示为男性。
     */
    private function genderName(int $gender): string
    {
        return match ($gender) {
            0 => 'MALE',
            1 => 'FEMALE',
            default => 'UNKNOWN',
        };
    }

    /**
     * 接口名 → 性别编码：MALE→0、FEMALE→1，其余（UNKNOWN/空/非数字）→2未知
     *
     * 原来未知一律落到 0 男，患者性别不明会被存成男性。
     */
    private function genderCode(?string $gender): int
    {
        return match (strtoupper(trim((string) $gender))) {
            'MALE', 'GENDER_MALE', '0' => 0,
            'FEMALE', 'GENDER_FEMALE', '1' => 1,
            default => 2,
        };
    }
}
