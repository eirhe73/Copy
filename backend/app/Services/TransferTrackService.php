<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Handover;
use App\Models\PatientVital;
use App\Models\Transfer;
use App\Models\TransferMilestone;
use App\Models\VehicleLocation;
use Carbon\Carbon;

/**
 * 转运任务详情与历史轨迹回放
 */
class TransferTrackService extends Service
{
    /**
     * 转运状态映射：int 存储值 => [英文码, 中文标签]（§4.2）
     */
    private const STATUS_LABELS = [
        0 => ['REQUESTED', '待接收'],
        1 => ['ACCEPTED', '已接收'],
        2 => ['IN_TRANSIT', '转运中'],
        3 => ['ARRIVED', '到院'],
        4 => ['COMPLETED', '已完成'],
        5 => ['REJECTED', '已拒绝'],
    ];

    /**
     * 转运任务详情（§3.11）
     */
    public function detail(string $transferNo): array
    {
        $transfer = Transfer::query()->with(['vehicle', 'patient'])->where('transfer_id', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        [$status, $statusLabel] = $this->status($transfer->status);

        return [
            'transferNo' => $transfer->transfer_id,
            'patientId' => $transfer->patient_id === null ? null : (string) $transfer->patient_id,
            'patientName' => $transfer->patient?->name ?? '',
            'vehicleId' => $vehicle?->vehicle_id ?? $transfer->transport_vehicle_id,
            'vehiclePlate' => $vehicle?->plate_number ?? '',
            'status' => $status,
            'statusLabel' => $statusLabel,
            'fromInstitutionId' => $transfer->source_institution_id,
            'toInstitutionId' => $transfer->target_institution_id,
            'doctorId' => $transfer->doctor_id,
            'nurseId' => $transfer->nurse_id,
            'startedAt' => $transfer->started_at?->toIso8601String(),
            'arrivedAt' => $transfer->arrived_at?->toIso8601String(),
            'handoverAt' => $transfer->completed_at?->toIso8601String(),
            'milestones' => $this->milestones($transferNo),
        ];
    }

    /**
     * 轨迹回放（§3.2）
     */
    public function track(string $transferNo, array $filters): array
    {
        $transfer = Transfer::query()->with('vehicle')->where('transfer_id', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        $vehicleId = $vehicle?->vehicle_id ?? $transfer->transport_vehicle_id;

        $query = VehicleLocation::query()->where('vehicle_id', $vehicleId);

        if (! empty($filters['from'])) {
            $query->where('located_at', '>=', Carbon::parse($filters['from']));
        }
        if (! empty($filters['to'])) {
            $query->where('located_at', '<=', Carbon::parse($filters['to']));
        }

        $points = $query->orderBy('located_at')->get()->map(fn (VehicleLocation $location) => [
            'lng' => (float) $location->lng,
            'lat' => (float) $location->lat,
            'speedKmh' => (int) $location->speed_kmh,
            'heading' => (int) $location->heading,
            'locatedAt' => $location->located_at?->toIso8601String(),
        ])->values()->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'transferNo' => $transfer->transfer_id,
            'vehicleId' => $vehicleId,
            'vehiclePlate' => $vehicle?->plate_number ?? '',
            'points' => $points,
            'milestones' => $this->milestones($transferNo),
        ];
    }

    /**
     * 车载监护（§3.12：患者/车辆摘要 + 最新体征 + 近 N 条时序）
     */
    public function monitor(string $transferNo, array $filters): array
    {
        $transfer = Transfer::query()->with(['vehicle', 'patient'])->where('transfer_id', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        $patient = $transfer->patient;
        [$status, $statusLabel] = $this->status($transfer->status);

        // 体征表 patient_id 存患者业务编号
        $patientId = $patient?->patient_id ?? $transfer->patient_id;
        $limit = min(max((int) ($filters['limit'] ?? 30), 1), 200);

        $series = collect();
        if ($patientId !== null) {
            $series = PatientVital::query()
                ->where('patient_id', $patientId)
                ->orderByDesc('measured_at')
                ->limit($limit)
                ->get()
                ->reverse()
                ->values();
        }

        return [
            'updatedAt' => now()->toIso8601String(),
            'transferNo' => $transfer->transfer_id,
            'patientId' => $patientId,
            'patientName' => $patient?->name ?? '',
            'vehicleId' => $vehicle?->vehicle_id ?? $transfer->transport_vehicle_id,
            'vehiclePlate' => $vehicle?->plate_number ?? '',
            'status' => $status,
            'statusLabel' => $statusLabel,
            'latest' => $this->vital($series->last()),
            'series' => $series->map(fn (PatientVital $v) => $this->vital($v))->all(),
        ];
    }

    /**
     * 到院交接清单（§3.13）
     */
    public function handoverList(string $transferNo): array
    {
        $transfer = Transfer::query()->where('transfer_id', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $list = Handover::query()
            ->where('transfer_no', $transfer->transfer_id)
            ->orderByDesc('handover_at')
            ->get()
            ->map(fn (Handover $h) => [
                'handoverId' => $h->handover_no,
                'task120Id' => $h->task120_id,
                'eventId' => $h->event_id,
                'patientId' => $h->patient_id,
                'patientName' => $h->patient_name,
                'fromStaffId' => $h->from_staff_id,
                'fromStaffName' => $h->from_staff_name,
                'toStaffId' => $h->to_staff_id,
                'toStaffName' => $h->to_staff_name,
                'toDept' => $h->to_dept,
                'handoverAt' => $h->handover_at?->toIso8601String(),
                'items' => $h->items,
                'signature' => $h->signature,
            ])->all();

        return [
            'transferNo' => $transfer->transfer_id,
            'total' => count($list),
            'list' => $list,
        ];
    }

    /**
     * 单条体征（车载监护字段契约）
     */
    private function vital(?PatientVital $vital): ?array
    {
        if ($vital === null) {
            return null;
        }

        return [
            'heartRate' => (int) $vital->heart_rate,
            'spo2' => (int) $vital->spo2,
            'resp' => (int) $vital->resp,
            'temp' => (float) $vital->temp,
            'systolic' => (int) $vital->systolic,
            'diastolic' => (int) $vital->diastolic,
            'news' => $vital->news,
            'at' => $vital->measured_at?->toIso8601String(),
        ];
    }

    /**
     * 里程碑时间轴
     */
    private function milestones(string $transferNo): array
    {
        return TransferMilestone::query()
            ->where('transfer_no', $transferNo)
            ->orderBy('occurred_at')
            ->get()
            ->map(fn (TransferMilestone $milestone) => [
                'key' => $milestone->milestone_key,
                'keyLabel' => $milestone->milestone_label,
                'at' => $milestone->occurred_at?->toIso8601String(),
                'by' => $milestone->actor,
            ])->values()->all();
    }

    /**
     * 状态码与展示名归一化：int => [英文码, 中文标签]
     */
    private function status(?int $raw): array
    {
        return self::STATUS_LABELS[(int) $raw] ?? ['', ''];
    }
}
