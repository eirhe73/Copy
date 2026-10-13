<?php

namespace App\Services;

use App\Models\CareBinding;

/**
 * 床-患-设备-摄像头四元绑定（§11.2）
 */
class CareBindingService extends Service
{
    private const SCOPE_CODES = [
        0 => 'LOCAL',
        1 => 'PARTNER',
        2 => 'LOWER',
    ];

    private const SCOPE_LABELS = [
        0 => '本院',
        1 => '协作医院',
        2 => '下级医院',
    ];

    private const SCOPE_INPUT = [
        'LOCAL' => 0,
        'PARTNER' => 1,
        'LOWER' => 2,
    ];

    public function index(array $filters): array
    {
        $scope = $filters['scope'] ?? null;
        $scopeCode = is_string($scope) ? (self::SCOPE_INPUT[strtoupper($scope)] ?? null) : null;

        $bindings = CareBinding::query()
            ->when($scopeCode !== null, fn ($q) => $q->where('scope', $scopeCode))
            ->orderBy('scope')
            ->orderBy('bed_id')
            ->get()
            ->map(fn (CareBinding $b) => [
                'scope' => self::SCOPE_CODES[$b->scope] ?? 'LOCAL',
                'scopeLabel' => self::SCOPE_LABELS[$b->scope] ?? '',
                'hospital' => $b->hospital,
                'ward' => $b->ward,
                'bedId' => $b->bed_id,
                'bedLabel' => $b->bed_label,
                'patientId' => $b->patient_id,
                'patientName' => $b->patient_name,
                'deviceId' => $b->device_id,
                'deviceName' => $b->device_name,
                'cameraId' => $b->camera_id,
                'boundAt' => optional($b->bound_at)->toIso8601String(),
            ])->values()->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'notice' => '演示绑定 · 床 / 患者 / 设备互跳',
            'bindings' => $bindings,
        ];
    }
}
