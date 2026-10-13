<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\EmergencyEvent;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

class DispatchTaskService extends Service
{
    /** 出警中 */
    private const STATUS_DISPATCHING = 1;

    /**
     * 任务分派：为急救事件指派救护车与随车班组，事务内同步事件与车辆状态
     */
    public function assign(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $event = EmergencyEvent::query()->where('event_code', $data['eventId'])->first();
            $this->assert($event !== null, ResponseCode::NOT_FOUND, '事件不存在');

            $vehicle = Vehicle::query()->where('vehicle_id', $data['vehicleId'])->first();
            $this->assert($vehicle !== null, ResponseCode::NOT_FOUND, '车辆不存在');

            // 车辆未待命且已关联事件，视为有未完成任务，不可重复分派
            $this->assert(
                $vehicle->status === 0 || empty($vehicle->current_event_id),
                ResponseCode::CONFLICT,
                '车辆当前有未完成任务，不可重复分派'
            );

            $plate = ! empty($data['vehiclePlate']) ? $data['vehiclePlate'] : $vehicle->plate_number;

            $event->vehicle_id = $vehicle->vehicle_id;
            $event->vehicle_plate = (string) $plate;
            if (! empty($data['destination'])) {
                $event->destination = $data['destination'];
            }
            $event->status = self::STATUS_DISPATCHING;
            $event->save();

            $vehicle->status = self::STATUS_DISPATCHING;
            $vehicle->current_event_id = $event->event_code;
            if (! empty($data['crew'])) {
                $vehicle->crew = $data['crew'];
            }
            $vehicle->save();

            return [
                'eventId' => $event->event_code,
                'vehicleId' => $vehicle->vehicle_id,
                'vehiclePlate' => $event->vehicle_plate,
                'status' => 'DISPATCHING',
            ];
        });
    }
}
