<?php

namespace App\Services;

use App\Models\ConsultRoom;
use App\Models\ConsultSession;
use App\Models\Department;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * 远程会诊系统（音视频能力）对接
 *
 * 三条约定：
 * 1. 单向依赖 —— 只有主系统调用会诊系统，会诊系统不反向访问主系统。
 * 2. 降级不阻断 —— 任何网络/业务失败都返回 null 或 false，由调用方决定降级，
 *    绝不向上抛业务异常，保证外部系统故障不影响会诊主流程。
 * 3. 日志脱敏 —— 只记会诊单号与会议 ID，不记患者姓名、票据、签名等敏感值。
 */
class ConsultRtcService extends Service
{
    /** 音视频同步状态 */
    public const SYNC_NONE = 0;
    public const SYNC_OK = 1;
    public const SYNC_FAILED = 2;

    /** 主系统性别编码 → 会诊系统 PatientProfile.gender */
    private const GENDER_MAP = ['MALE' => 'M', 'FEMALE' => 'F', 'M' => 'M', 'F' => 'F'];

    /**
     * 对接开关：未开启时所有写操作直接返回 null，主系统退化为本地占位会诊室
     */
    public function enabled(): bool
    {
        $cfg = config('services.consultation');

        return (bool) ($cfg['enabled'] ?? false) && ! empty($cfg['base_url']);
    }

    /**
     * 创建会议（会诊系统 B1，实际路径 POST /api/rooms）
     *
     * @return array{rtcSessionId:string, rtcRoomId:int, joinToken:string, ownerToken:string, wsTicket:string, videoEnabled:bool}|null
     */
    public function createRoom(ConsultSession $session, ConsultRoom $room, string $ownerName = ''): ?array
    {
        if (! $this->enabled()) {
            return null;
        }

        $payload = [
            'roomName' => $this->roomName($session),
            'displayName' => $ownerName !== '' ? $ownerName : '医生',
            'consultId' => $session->session_id,
            'eventId' => $session->task120_id,
            'patientContext' => $this->patientContext($session),
            'invitees' => $this->invitees($session),
            'invitedUserIds' => $this->invitedUserIds($session),
        ];

        $data = $this->call('post', '/api/rooms', $payload);
        if ($data === null || empty($data['sessionId'])) {
            $this->markSync($room, self::SYNC_FAILED);

            return null;
        }

        // 注：会诊系统当前版本返回的 ownerToken 实为 ownerTicket（已知缺陷，已在会诊系统侧修复中），
        // 主系统只把它当作"房主凭证"原样保存与回传，不依赖其具体形态。
        $room->forceFill([
            'rtc_session_id' => (string) $data['sessionId'],
            'rtc_room_id' => (int) ($data['roomId'] ?? 0) ?: null,
            'rtc_join_token' => (string) ($data['joinToken'] ?? ''),
            'rtc_owner_token' => (string) ($data['ownerToken'] ?? ''),
            'media_mode' => 'RTC',
            // 只存不带票据的入会基址：ownerTicket 60 秒失效，存进库就是死链。
            // 需要入会时一律走 GET /consultations/{sessionId}/join-link 现签。
            'rtc_url' => $this->buildJoinUrl((string) $data['sessionId']),
        ])->save();
        $this->markSync($room, self::SYNC_OK);

        return [
            'rtcSessionId' => (string) $data['sessionId'],
            'rtcRoomId' => (int) ($data['roomId'] ?? 0),
            'joinToken' => (string) ($data['joinToken'] ?? ''),
            'ownerToken' => (string) ($data['ownerToken'] ?? ''),
            'wsTicket' => (string) ($data['wsTicket'] ?? ''),
            'videoEnabled' => (bool) ($data['videoEnabled'] ?? false),
        ];
    }

    /**
     * 确保会议可用：已同步且能探活到则直接返回，否则按同一 consultId 重建。
     * 用于兜底会诊系统重启（内存态会议丢失）的场景。
     */
    public function ensureRoom(ConsultSession $session, ConsultRoom $room, string $ownerName = ''): ?array
    {
        if (! $this->enabled()) {
            return null;
        }

        if (! empty($room->rtc_session_id) && $this->probe((string) $room->rtc_session_id)) {
            return [
                'rtcSessionId' => (string) $room->rtc_session_id,
                'rtcRoomId' => (int) ($room->rtc_room_id ?? 0),
                'joinToken' => (string) $room->rtc_join_token,
                'ownerToken' => (string) $room->rtc_owner_token,
                'wsTicket' => '',
                'videoEnabled' => true,
            ];
        }

        return $this->createRoom($session, $room, $ownerName);
    }

    /**
     * 探活：会议是否仍然存在且未结束
     */
    public function probe(string $rtcSessionId): bool
    {
        if (! $this->enabled() || $rtcSessionId === '') {
            return false;
        }

        $data = $this->call('get', '/api/rooms/'.rawurlencode($rtcSessionId));

        return $data !== null && ($data['state'] ?? '') !== 'ENDED';
    }

    /**
     * 拉取参会人，用于主系统补参会留痕
     *
     * 优先取"曾入会成员" attended（含已退出）——只取在线列表会漏记先退出的医生。
     * 会诊系统旧版本没有 attended 字段时回退到当前在线列表。
     *
     * @return array<int, array{userId:string, displayName:string}>
     */
    public function participants(string $rtcSessionId): array
    {
        if (! $this->enabled() || $rtcSessionId === '') {
            return [];
        }

        $data = $this->call('get', '/api/rooms/'.rawurlencode($rtcSessionId));
        if ($data === null) {
            return [];
        }

        $source = ! empty($data['attended']) ? $data['attended'] : ($data['participants'] ?? []);

        return collect($source)
            ->map(fn ($p) => [
                'userId' => (string) ($p['userId'] ?? ''),
                'displayName' => (string) ($p['displayName'] ?? ''),
            ])
            ->filter(fn ($p) => $p['displayName'] !== '')
            ->values()
            ->all();
    }

    /**
     * 补签房主入会票据（60 秒有效），凭已保存的 ownerToken 换取
     */
    public function mintOwnerTicket(ConsultRoom $room): ?string
    {
        if (! $this->enabled() || empty($room->rtc_session_id) || empty($room->rtc_owner_token)) {
            return null;
        }

        $data = $this->call('post', '/api/rooms/'.rawurlencode((string) $room->rtc_session_id).'/owner-ticket', [
            'ownerToken' => (string) $room->rtc_owner_token,
        ]);

        return $data['ownerTicket'] ?? null;
    }

    /**
     * 结束会议（会诊系统 B4，需房主凭证）
     */
    public function endRoom(ConsultRoom $room): bool
    {
        if (! $this->enabled() || empty($room->rtc_session_id) || empty($room->rtc_owner_token)) {
            return false;
        }

        $data = $this->call('delete', '/api/rooms/'.rawurlencode((string) $room->rtc_session_id), [
            'ownerToken' => (string) $room->rtc_owner_token,
        ]);

        return $data !== null;
    }

    /**
     * 拼装医生入会链接
     *
     * @param  array<string, string>  $query  房主用 ownerTicket，受邀专家用 token
     */
    public function buildJoinUrl(string $rtcSessionId, array $query): string
    {
        $base = rtrim((string) (config('services.consultation.join_base_url') ?: config('services.consultation.base_url')), '/');
        if ($base === '' || $rtcSessionId === '') {
            return '';
        }
        $query = array_filter($query, fn ($v) => $v !== null && $v !== '');

        return $base.'/#/join/'.rawurlencode($rtcSessionId).($query ? '?'.http_build_query($query) : '');
    }

    /**
     * 患者上下文：映射为会诊系统 PatientProfile
     * 主系统 patients 表没有住院号/病区/床位的字段，缺失项一律留空，不臆造。
     */
    private function patientContext(ConsultSession $session): array
    {
        $patient = ! empty($session->patient_id)
            ? Patient::where('patient_id', $session->patient_id)->first()
            : null;

        // 性别：主系统 patients.gender 为 0男 1女 2未知，接口层为 MALE/FEMALE；会诊系统为 M/F/U
        $gender = $patient !== null
            ? $this->genderOf($patient->gender)
            : ($session->patient_gender !== null ? ((int) $session->patient_gender === 1 ? 'F' : 'M') : 'U');

        $dept = $session->department ?: ($patient->department_id ?? '');
        if ($patient !== null && $patient->department_id && ! $session->department) {
            $dept = $this->departmentName((string) $patient->department_id) ?: (string) $patient->department_id;
        }

        return [
            'patientId' => (string) ($session->patient_id ?? ''),
            'patientType' => empty($session->patient_id) ? 'TEMP' : 'FORMAL',
            'name' => (string) ($session->patient_name ?? ''),
            'nameMasked' => (bool) config('services.consultation.name_masked', false),
            'gender' => $gender,
            'age' => (int) ($session->patient_age ?? 0),
            'ageUnit' => '岁',
            'dept' => (string) $dept,
            'summary' => [
                'chiefComplaint' => (string) ($session->chief_complaint ?? ''),
                'statusNote' => (string) ($patient->stage ?? ''),
            ],
        ];
    }

    /**
     * 主系统性别 → 会诊系统 M/F/U
     *
     * patients.gender 取值：0男、1女、2未知，也可能是 MALE/FEMALE 字符串。
     * 未知(2) 必须映射为 U —— 落入 M 会把性别不明的患者显示成男性。
     */
    private function genderOf(mixed $gender): string
    {
        // 空值一律按未知处理：'' 与 null 强转 int 都是 0，不先判空会误判为男性
        if ($gender === null || trim((string) $gender) === '') {
            return 'U';
        }

        $key = strtoupper(trim((string) $gender));
        if (isset(self::GENDER_MAP[$key])) {
            return self::GENDER_MAP[$key];
        }
        // 无法识别的字符串（如 UNKNOWN）按未知处理，强转 int 会变成 0 而误判为男性
        if (! is_numeric($gender)) {
            return 'U';
        }

        return match ((int) $gender) {
            1 => 'F',
            0 => 'M',
            default => 'U',
        };
    }

    /**
     * 受邀专家明细：会诊系统用它替代内置专家目录，在入会页展示"受邀专家点击认领"
     * 跨系统用户标识统一用 users.username。
     */
    private function invitees(ConsultSession $session): array
    {
        $usernames = $this->invitedUserIds($session);
        if ($usernames === []) {
            return [];
        }

        $users = User::with('organization')->whereIn('username', $usernames)->get()->keyBy('username');
        $deptNames = $this->deptNames($users->pluck('department_id')->filter()->all());

        $list = [];
        foreach ($usernames as $username) {
            $user = $users->get($username);
            if ($user === null) {
                continue;
            }
            $list[] = [
                'userId' => $user->username,
                'name' => $user->real_name,
                'org' => $user->organization->org_name ?? '',
                'dept' => $deptNames[$user->department_id] ?? (string) ($user->department_id ?? ''),
                'title' => $user->profession ?? '',
                'role' => $username === $session->nominated_doctor_id ? 'EXPERT' : 'DOCTOR',
            ];
        }

        return $list;
    }

    /**
     * 受邀专家用户名：指定医生 + 目标科室医生（上限 20，避免单次载荷过大）
     */
    private function invitedUserIds(ConsultSession $session): array
    {
        $ids = array_filter([(string) ($session->nominated_doctor_id ?? '')]);

        $query = User::query()->where('identity_type', 'DOCTOR');
        if (! empty($session->department)) {
            $query->where('department_id', $session->department);
        }
        $ids = array_merge($ids, $query->limit(20)->pluck('username')->all());

        return array_values(array_unique(array_filter($ids)));
    }

    private function deptNames(array $codes): array
    {
        $codes = array_values(array_filter($codes));
        if ($codes === []) {
            return [];
        }

        return Department::whereIn('dept_code', $codes)->pluck('dept_name', 'dept_code')->all();
    }

    private function departmentName(string $code): ?string
    {
        return Department::where('dept_code', $code)->value('dept_name');
    }

    private function roomName(ConsultSession $session): string
    {
        return trim($session->patient_name.' · '.$session->hospital.' · '.$session->department, ' ·') ?: '远程会诊';
    }

    /**
     * 统一 HTTP 调用：服务令牌、超时、错误降级、脱敏日志
     *
     * @return array<string, mixed>|null 失败返回 null
     */
    private function call(string $method, string $path, array $payload = []): ?array
    {
        $cfg = config('services.consultation');
        $baseUrl = rtrim((string) $cfg['base_url'], '/');
        $timeout = max(1, (int) ($cfg['timeout'] ?? 3));

        try {
            $request = Http::baseUrl($baseUrl)
                ->timeout($timeout)
                ->acceptJson()
                ->asJson()
                ->withHeaders(array_filter([
                    'X-Service-Token' => (string) ($cfg['service_token'] ?? ''),
                ]));

            $response = match ($method) {
                'get' => $request->get($path),
                'delete' => $request->delete($path, $payload),
                default => $request->post($path, $payload),
            };

            if (! $response->successful()) {
                Log::warning('会诊系统调用失败', [
                    'method' => $method,
                    'status' => $response->status(),
                    // 只记端点与状态码，不回显响应体（可能含患者信息）
                ]);

                return null;
            }

            return $response->json() ?: [];
        } catch (\Throwable $e) {
            Log::warning('会诊系统不可达', [
                'method' => $method,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function markSync(ConsultRoom $room, int $status): void
    {
        $room->forceFill([
            'rtc_sync_status' => $status,
            'rtc_synced_at' => now(),
        ])->save();
    }
}
