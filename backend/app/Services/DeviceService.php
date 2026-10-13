<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Bed;
use App\Models\DeviceInspection;
use App\Models\MedicalDevice;
use App\Models\Patient;

/**
 * 急救监控 · 2.5 床旁设备绑定业务服务
 */
class DeviceService extends Service
{
    /** §3.1 台账提示语 */
    private const NOTICE = '演示设备台账 · 与 bed 号对齐';

    /** 巡检结果字典 */
    private const RESULT_LABELS = [
        'ok' => '正常',
        'fault' => '异常',
    ];

    /**
     * §3.1 获取设备台账与床位列表
     */
    public function index(array $filters): array
    {
        $ward = $filters['ward'] ?? null;

        $beds = Bed::query()
            ->where('enabled', true)
            ->when($ward, fn ($q, $v) => $q->where('department_id', $v))
            ->orderBy('bed_id')
            ->get(['bed_id', 'label', 'department_id']);

        $devices = MedicalDevice::query()
            ->when($ward, fn ($q) => $q->whereIn('bed_id', $beds->pluck('bed_id')->all()))
            ->orderBy('device_id')
            ->get();

        return [
            'updatedAt' => now()->toIso8601String(),
            'notice' => self::NOTICE,
            'devices' => $devices->map(fn (MedicalDevice $d) => $this->deviceItem($d))->all(),
            'beds' => $beds->map(fn (Bed $b) => [
                'bedId' => $b->bed_id,
                'label' => $b->label,
                'ward' => $b->department_id,
            ])->all(),
        ];
    }

    /**
     * §5.1 新增设备
     */
    public function store(array $data): array
    {
        $this->assert(
            ! MedicalDevice::query()->where('device_id', $data['deviceId'])->exists(),
            ResponseCode::CONFLICT,
            '设备编号已存在'
        );

        $bedId = $data['bedId'] ?? null;

        $device = MedicalDevice::create([
            'device_id' => $data['deviceId'],
            'name' => $data['name'],
            'bed_id' => $bedId ?: null,
            'bed_label' => $data['bedLabel'] ?? null,
            'patient_id' => $data['patientId'] ?? null,
            'patient_name' => $data['patientName'] ?? null,
            'online' => (bool) ($data['online'] ?? false),
            'alarm' => (bool) ($data['alarm'] ?? false),
            'bound_at' => $bedId ? now() : null,
        ]);

        return ['deviceId' => $device->device_id];
    }

    /**
     * §3.2 设备改绑/解绑床位
     */
    public function updateBinding(string $deviceId, array $data): array
    {
        $device = $this->findDevice($deviceId);

        $previousBedId = $device->bed_id;
        $bedId = trim((string) ($data['bedId'] ?? ''));

        // 空串表示解绑
        if ($bedId === '') {
            $unboundAt = now();
            $device->update([
                'previous_bed_id' => $previousBedId,
                'bed_id' => null,
                'bed_label' => null,
                'patient_id' => null,
                'patient_name' => null,
                'bound_at' => null,
                'unbound_at' => $unboundAt,
            ]);

            return [
                'deviceId' => $device->device_id,
                'bedId' => null,
                'bedLabel' => null,
                'previousBedId' => $previousBedId,
                'boundAt' => null,
            ];
        }

        $bed = Bed::query()->where('bed_id', $bedId)->first();
        $this->assert($bed !== null, ResponseCode::BAD_REQUEST, '床位不存在');

        $patientName = $bed->patient_id
            ? Patient::query()->where('patient_code', $bed->patient_id)->value('real_name')
            : null;

        $boundAt = now();
        $device->update([
            'previous_bed_id' => $previousBedId,
            'bed_id' => $bed->bed_id,
            'bed_label' => $data['bedLabel'] ?? $bed->label,
            'patient_id' => $bed->patient_id,
            'patient_name' => $patientName,
            'bound_at' => $boundAt,
            'unbound_at' => null,
        ]);

        return [
            'deviceId' => $device->device_id,
            'bedId' => $bed->bed_id,
            'bedLabel' => $device->bed_label,
            'previousBedId' => $previousBedId,
            'boundAt' => $boundAt->toIso8601String(),
        ];
    }

    /**
     * §5.2 更新设备（只更新传入字段，床位变更建议走改绑接口）
     */
    public function update(string $id, array $data): array
    {
        $device = $this->findDevice($id);

        $columnMap = [
            'name' => 'name',
            'online' => 'online',
            'alarm' => 'alarm',
            'bedId' => 'bed_id',
            'bedLabel' => 'bed_label',
            'patientId' => 'patient_id',
            'patientName' => 'patient_name',
        ];

        $updates = [];
        foreach ($columnMap as $key => $column) {
            if (array_key_exists($key, $data)) {
                $updates[$column] = $data[$key];
            }
        }

        if ($updates !== []) {
            $device->update($updates);
        }

        return ['deviceId' => $device->device_id];
    }

    /**
     * §5.3 获取设备巡检记录（异常置顶 + 分页）
     */
    public function inspections(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $query = DeviceInspection::query()
            ->when(! empty($filters['deviceId']), fn ($q, $v) => $q->where('device_id', $v))
            ->when(! empty($filters['result']), fn ($q, $v) => $q->where('result', $v));

        $paginator = $query
            ->orderByRaw("CASE WHEN result = 'fault' THEN 0 ELSE 1 END")
            ->orderByDesc('check_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $deviceIds = collect($paginator->items())->pluck('device_id')->unique()->all();
        $names = MedicalDevice::query()->whereIn('device_id', $deviceIds)->pluck('name', 'device_id');

        $list = collect($paginator->items())
            ->map(fn (DeviceInspection $i) => [
                'inspectionId' => $i->inspection_id,
                'deviceId' => $i->device_id,
                'deviceName' => $names[$i->device_id] ?? '',
                'item' => $i->item,
                'result' => $i->result,
                'resultLabel' => self::RESULT_LABELS[$i->result] ?? $i->result,
                'inspector' => $i->inspector,
                'checkAt' => $i->check_at?->toIso8601String(),
                'note' => $i->note,
            ])
            ->all();

        return [
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * 设备台账列表项（供 §3.1 复用）
     */
    private function deviceItem(MedicalDevice $d): array
    {
        return [
            'deviceId' => $d->device_id,
            'name' => $d->name,
            'bedId' => $d->bed_id,
            'bedLabel' => $d->bed_label,
            'patientId' => $d->patient_id,
            'patientName' => $d->patient_name,
            'online' => (bool) $d->online,
            'alarm' => (bool) $d->alarm,
            'boundAt' => $d->bound_at?->toIso8601String(),
            'previousBedId' => $d->previous_bed_id,
            'unboundAt' => $d->unbound_at?->toIso8601String(),
        ];
    }

    /**
     * 兼容 device_id 与自增主键
     */
    private function findDevice(string $id): MedicalDevice
    {
        $device = MedicalDevice::query()->where('device_id', $id)->first();

        if (! $device && ctype_digit($id)) {
            $device = MedicalDevice::query()->find((int) $id);
        }

        $this->assert($device instanceof MedicalDevice, ResponseCode::NOT_FOUND, '设备不存在');

        return $device;
    }
}
