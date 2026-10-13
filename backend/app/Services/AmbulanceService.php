<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\EmergencyEvent;
use App\Models\Vehicle;
use App\Models\VehicleLocation;

/**
 * 救护车台账：列表与车辆看板详情
 */
class AmbulanceService extends Service
{
    /**
     * 车辆状态枚举：code => [statusLabel]
     */
    private const STATUS_LABELS = [
        0 => '待命',
        1 => '出警中',
        2 => '现场处置',
        3 => '返院途中',
    ];

    private const STATUS_CODES = [
        0 => 'STANDBY',
        1 => 'DISPATCHING',
        2 => 'ON_SCENE',
        3 => 'RETURNING',
    ];

    /**
     * 救护车列表（§3.3）
     */
    public function list(): array
    {
        $vehicles = Vehicle::query()
            ->with('organization')
            ->orderBy('plate_number')
            ->get();

        return [
            'updatedAt' => now()->toIso8601String(),
            'ambulances' => $vehicles->map(fn (Vehicle $vehicle) => $this->summary($vehicle))->values()->all(),
        ];
    }

    /**
     * 救护车详情（§3.8）
     */
    public function detail(string $vehicleId): array
    {
        $vehicle = Vehicle::query()
            ->with('organization')
            ->where('vehicle_id', $vehicleId)
            ->first();

        $this->assert($vehicle !== null, ResponseCode::NOT_FOUND, '车辆不存在');

        $data = $this->summary($vehicle);
        $data['currentEvent'] = $this->currentEvent($vehicle);
        $data['latestLocation'] = $this->latestLocation($vehicle);

        return $data;
    }

    /**
     * 列表项 / 详情公共字段
     */
    private function summary(Vehicle $vehicle): array
    {
        $status = (int) $vehicle->status;

        return [
            'id' => $vehicle->vehicle_id !== null && $vehicle->vehicle_id !== ''
                ? $vehicle->vehicle_id
                : (string) $vehicle->id,
            'plate' => $vehicle->plate_number,
            'org' => $vehicle->organization?->org_name ?? '',
            'boundHospital' => $vehicle->bound_hospital ?? '',
            'crew' => $vehicle->crew ?? '',
            'status' => self::STATUS_CODES[$status] ?? self::STATUS_CODES[0],
            'statusLabel' => self::STATUS_LABELS[$status] ?? self::STATUS_LABELS[0],
            'currentEventId' => $vehicle->current_event_id,
        ];
    }

    /**
     * 当前关联急救事件摘要
     */
    private function currentEvent(Vehicle $vehicle): ?array
    {
        if ($vehicle->current_event_id === null || $vehicle->current_event_id === '') {
            return null;
        }

        $event = EmergencyEvent::query()
            ->where('event_code', $vehicle->current_event_id)
            ->first();

        if ($event === null) {
            return null;
        }

        return [
            'task120Id' => $event->task120_id,
            'chiefComplaint' => $event->chief,
            'destination' => $event->destination,
            'etaHospitalMinutes' => $event->eta_hospital_minutes,
        ];
    }

    /**
     * 最新一条车辆定位
     */
    private function latestLocation(Vehicle $vehicle): ?array
    {
        $location = VehicleLocation::query()
            ->where('vehicle_id', $vehicle->vehicle_id)
            ->orderByDesc('located_at')
            ->first();

        if ($location === null) {
            return null;
        }

        return [
            'lng' => (float) $location->lng,
            'lat' => (float) $location->lat,
            'speedKmh' => (int) $location->speed_kmh,
            'heading' => (int) $location->heading,
            'locatedAt' => $location->located_at?->toIso8601String(),
        ];
    }
}
