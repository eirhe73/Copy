<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Organization;
use App\Models\Patient;
use App\Models\Transfer;

/**
 * 转诊协同：列表、发起、详情、状态流转、华西绿色通道、响应时长统计（03-转诊协同 §3.2~3.6）
 */
class TransferService extends Service
{
    /** 方向：int => API 码（§4.1） */
    private const DIRECTION_CODES = [0 => 'UP', 1 => 'DOWN'];

    /** 方向：int => 中文标签 */
    private const DIRECTION_LABELS = [0 => '上转', 1 => '下转'];

    /** 状态：int => [API 码, 中文标签]（§4.2） */
    private const STATUS_CODES = [
        0 => ['REQUESTED', '待接收'],
        1 => ['ACCEPTED', '已接收'],
        2 => ['IN_TRANSIT', '转运中'],
        3 => ['ARRIVED', '到院'],
        4 => ['COMPLETED', '已完成'],
        5 => ['REJECTED', '已拒绝'],
    ];

    /** 合法状态流转：当前状态 => 允许流转到的状态（§4.2） */
    private const TRANSITIONS = [
        0 => [1, 5],
        1 => [2],
        2 => [3],
        3 => [4],
    ];

    /** 华西绿色通道类型（§4.3） */
    private const CHANNELS = [
        ['type' => 'chest_pain', 'name' => '胸痛中心'],
        ['type' => 'stroke', 'name' => '卒中中心'],
        ['type' => 'trauma', 'name' => '创伤中心'],
        ['type' => 'critical_pregnant', 'name' => '危重孕产妇'],
        ['type' => 'neonatal', 'name' => '危重新生儿'],
    ];

    /**
     * 转诊列表（§3.2）
     */
    public function index(array $filters): array
    {
        $query = Transfer::query();

        $direction = $filters['direction'] ?? null;
        if ($direction !== null && $direction !== '') {
            $code = $this->directionInt((string) $direction);
            $this->assert($code !== null, ResponseCode::BAD_REQUEST, 'direction 参数不合法');
            $query->where('direction', $code);
        }

        $statuses = $this->parseStatuses($filters['status'] ?? null);
        if ($statuses !== null) {
            $query->whereIn('status', $statuses);
        }

        $keyword = $filters['keyword'] ?? null;
        if ($keyword !== null && $keyword !== '') {
            $query->where(function ($sub) use ($keyword) {
                $sub->where('patient_name', 'like', "%{$keyword}%")
                    ->orWhere('transfer_id', 'like', "%{$keyword}%");
            });
        }

        $pageNum = max(1, (int) ($filters['pageNum'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 20)));

        $total = (clone $query)->count();
        $rows = $query->orderByDesc('started_at')->orderByDesc('id')->forPage($pageNum, $pageSize)->get();
        $orgNames = $this->orgNames($rows->pluck('source_institution_id')->merge($rows->pluck('target_institution_id'))->all());

        return [
            'total' => $total,
            'list' => $rows->map(fn (Transfer $t) => $this->item($t, $orgNames))->values()->all(),
        ];
    }

    /**
     * 发起转诊（§3.3）
     */
    public function store(array $data): array
    {
        $patient = Patient::query()->where('patient_id', $data['patientId'])->first();
        $this->assert($patient !== null, ResponseCode::NOT_FOUND, '患者不存在');

        $transfer = Transfer::create([
            'patient_id' => $patient->patient_id,
            'patient_name' => $patient->name,
            'direction' => $this->directionInt($data['direction']),
            'source_institution_id' => $data['sourceInstitutionId'],
            'source_department_id' => $data['sourceDepartmentId'] ?? '',
            'target_institution_id' => $data['targetInstitutionId'],
            'target_department_id' => $data['targetDepartmentId'] ?? '',
            'status' => Transfer::STATUS_REQUESTED,
            'green_channel' => (bool) ($data['greenChannel'] ?? false),
            'channel_type' => $data['channelType'] ?? '',
            'reason' => $data['reason'] ?? '',
            'created_by' => auth()->user()->username ?? '',
            'started_at' => now(),
        ]);

        return [
            'transferId' => $transfer->transfer_id,
            'status' => self::STATUS_CODES[Transfer::STATUS_REQUESTED][0],
        ];
    }

    /**
     * 转诊详情（§3.2 单项）
     */
    public function show(Transfer $transfer): array
    {
        return $this->item($transfer, $this->orgNames([$transfer->source_institution_id, $transfer->target_institution_id]));
    }

    /**
     * 更新转诊：推进状态或修改目标/车辆（§3.4）
     */
    public function update(Transfer $transfer, array $data): array
    {
        if (array_key_exists('status', $data) && $data['status'] !== null && $data['status'] !== '') {
            $this->transition($transfer, (string) $data['status']);
        }

        foreach ([
            'targetInstitutionId' => 'target_institution_id',
            'targetDepartmentId' => 'target_department_id',
            'transportVehicleId' => 'transport_vehicle_id',
        ] as $input => $column) {
            if (array_key_exists($input, $data) && $data[$input] !== null) {
                $transfer->{$column} = $data[$input];
            }
        }

        $transfer->save();

        return $this->item($transfer, $this->orgNames([$transfer->source_institution_id, $transfer->target_institution_id]));
    }

    /**
     * 接收方确认：待接收 → 已接收（§3.4）
     */
    public function confirm(Transfer $transfer): array
    {
        return $this->applyTransition($transfer, Transfer::STATUS_ACCEPTED);
    }

    /**
     * 接收方拒绝：待接收 → 已拒绝（§3.4）
     */
    public function reject(Transfer $transfer): array
    {
        return $this->applyTransition($transfer, Transfer::STATUS_REJECTED);
    }

    /**
     * 华西绿色通道（§3.5）
     */
    public function greenChannel(?string $institutionId): array
    {
        $channels = array_map(fn (array $c) => [
            'type' => $c['type'],
            'name' => $c['name'],
            'openCount' => 0,
            'reservedBeds' => 0,
            'avgResponseMinutes' => 0,
        ], self::CHANNELS);

        return [
            'updatedAt' => now()->toIso8601String(),
            'channels' => $channels,
        ];
    }

    /**
     * 响应时长统计（§3.6：accepted_at - started_at，仅已接收及其后状态计入）
     */
    public function responseTime(array $filters): array
    {
        $days = min(max((int) ($filters['days'] ?? 7), 1), 90);
        $from = now()->subDays($days);
        $institutionId = $filters['institutionId'] ?? $filters['institution_id'] ?? null;

        $rows = Transfer::query()
            ->where('status', '>=', Transfer::STATUS_ACCEPTED)
            ->whereNotNull('accepted_at')
            ->whereNotNull('started_at')
            ->where('started_at', '>=', $from)
            ->when($institutionId !== null && $institutionId !== '', fn ($q) => $q->where('target_institution_id', $institutionId))
            ->get(['id', 'target_institution_id', 'started_at', 'accepted_at'])
            ->map(fn (Transfer $t) => [
                'minutes' => max(0, (int) $t->started_at->diffInMinutes($t->accepted_at, false)),
                'orgId' => $t->target_institution_id,
                'date' => $t->accepted_at->toDateString(),
            ]);

        $minutes = $rows->pluck('minutes')->sort()->values();
        $count = $minutes->count();

        $byOrgCodes = $rows->groupBy('orgId')->filter(fn ($g, $k) => $k !== null && $k !== '');
        $orgNames = Organization::query()->whereIn('org_code', $byOrgCodes->keys())->pluck('org_name', 'org_code');

        return [
            'updatedAt' => now()->toIso8601String(),
            'avgResponseMinutes' => $count ? (float) round($minutes->avg(), 1) : 0,
            'p50Minutes' => $count ? (int) $minutes->get((int) floor(($count - 1) * 0.5)) : 0,
            'p90Minutes' => $count ? (int) $minutes->get((int) floor(($count - 1) * 0.9)) : 0,
            'minMinutes' => $count ? (int) $minutes->first() : 0,
            'maxMinutes' => $count ? (int) $minutes->last() : 0,
            'byInstitution' => $byOrgCodes->map(function ($group, $orgCode) use ($orgNames) {
                $mins = $group->pluck('minutes');

                return [
                    'institutionId' => (string) $orgCode,
                    'institutionName' => $orgNames[$orgCode] ?? (string) $orgCode,
                    'count' => $mins->count(),
                    'avgResponseMinutes' => (float) round($mins->avg(), 1),
                ];
            })->sortByDesc('count')->values()->all(),
            'trend' => $rows->groupBy('date')->map(fn ($group, $date) => [
                'date' => $date,
                'avgResponseMinutes' => (float) round($group->pluck('minutes')->avg(), 1),
            ])->sortKeys()->values()->all(),
        ];
    }

    /**
     * 校验并落库一次状态流转
     */
    private function transition(Transfer $transfer, string $status): void
    {
        $target = $this->statusInt($status);
        $this->applyTransition($transfer, $target);
    }

    /**
     * 应用状态流转：非法跳跃抛 400，并按状态回填时间戳
     */
    private function applyTransition(Transfer $transfer, ?int $target): array
    {
        $current = (int) $transfer->status;
        $this->assert($target !== null, ResponseCode::BAD_REQUEST, 'status 参数不合法');
        $this->assert(in_array($target, self::TRANSITIONS[$current] ?? [], true), ResponseCode::BAD_REQUEST, '非法状态流转');

        $transfer->status = $target;
        $transfer->accepted_at ??= $target === Transfer::STATUS_ACCEPTED ? now() : null;
        $transfer->arrived_at ??= $target === Transfer::STATUS_ARRIVED ? now() : null;
        $transfer->completed_at ??= $target === Transfer::STATUS_COMPLETED ? now() : null;
        $transfer->save();

        return $this->item($transfer, $this->orgNames([$transfer->source_institution_id, $transfer->target_institution_id]));
    }

    /**
     * 组装列表项 / 详情对象（§3.2）
     */
    private function item(Transfer $transfer, array $orgNames): array
    {
        $direction = (int) $transfer->direction;
        [$statusCode, $statusLabel] = self::STATUS_CODES[(int) $transfer->status] ?? ['', ''];

        return [
            'transferId' => $transfer->transfer_id,
            'patientId' => (string) $transfer->patient_id,
            'patientName' => (string) $transfer->patient_name,
            'direction' => self::DIRECTION_CODES[$direction] ?? '',
            'directionLabel' => self::DIRECTION_LABELS[$direction] ?? '',
            'sourceInstitutionId' => $transfer->source_institution_id,
            'sourceInstitutionName' => $orgNames[$transfer->source_institution_id] ?? '',
            'targetInstitutionId' => $transfer->target_institution_id,
            'targetInstitutionName' => $orgNames[$transfer->target_institution_id] ?? '',
            'status' => $statusCode,
            'statusLabel' => $statusLabel,
            'greenChannel' => (bool) $transfer->green_channel,
            'channelType' => $transfer->channel_type,
            'reason' => $transfer->reason,
            'startedAt' => optional($transfer->started_at)->toIso8601String(),
        ];
    }

    /**
     * 机构 org_code => org_name
     */
    private function orgNames(iterable $codes): array
    {
        $codes = collect($codes)->filter(fn ($c) => $c !== null && $c !== '')->unique()->all();

        return $codes === [] ? [] : Organization::query()->whereIn('org_code', $codes)->pluck('org_name', 'org_code')->all();
    }

    private function directionInt(string $code): ?int
    {
        $key = array_search($code, self::DIRECTION_CODES, true);

        return $key === false ? null : $key;
    }

    private function statusInt(string $code): ?int
    {
        foreach (self::STATUS_CODES as $int => [$name]) {
            if ($name === $code) {
                return $int;
            }
        }

        return null;
    }

    /**
     * 逗号分隔状态码 => int 列表；无值返回 null（不过滤）
     */
    private function parseStatuses(mixed $raw): ?array
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        $codes = [];
        foreach (array_filter(array_map('trim', explode(',', (string) $raw))) as $name) {
            $code = $this->statusInt($name);
            $this->assert($code !== null, ResponseCode::BAD_REQUEST, 'status 参数不合法');
            $codes[] = $code;
        }

        return $codes === [] ? null : $codes;
    }
}
