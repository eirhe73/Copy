<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\VehicleLocation;

/**
 * 在途车辆 GPS 与 ETA（§3.2 · 车辆监控）
 */
class VehicleGpsService extends Service
{
    private const STATUS_CODES = [
        0 => 'STANDBY',
        1 => 'DISPATCHING',
        2 => 'ON_SCENE',
        3 => 'RETURNING',
    ];

    /**
     * 在途救护车实时位置列表（§8 3.2）
     */
    public function index(): array
    {
        $vehicles = Vehicle::query()
            ->where('status', '!=', 0)
            ->orderBy('plate_number')
            ->get();

        $list = $vehicles->map(function (Vehicle $vehicle) {
            $location = VehicleLocation::query()
                ->where('vehicle_id', $vehicle->vehicle_id)
                ->orderByDesc('located_at')
                ->first();

            $status = (int) $vehicle->status;

            return [
                'id' => $vehicle->vehicle_id !== null && $vehicle->vehicle_id !== ''
                    ? $vehicle->vehicle_id
                    : (string) $vehicle->id,
                'plate' => $vehicle->plate_number,
                'status' => self::STATUS_CODES[$status] ?? self::STATUS_CODES[0],
                'lng' => $location !== null ? (float) $location->lng : ($vehicle->latest_lng === null ? null : (float) $vehicle->latest_lng),
                'lat' => $location !== null ? (float) $location->lat : ($vehicle->latest_lat === null ? null : (float) $vehicle->latest_lat),
                'speedKmh' => $location !== null ? (int) $location->speed_kmh : 0,
                'heading' => $location !== null ? (int) $location->heading : 0,
                'destination' => $location->destination ?? '',
                'etaMinutes' => $location?->eta_minutes,
                'route' => $location?->route ?? [],
            ];
        })->values()->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'vehicles' => $list,
        ];
    }
}
