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
     * 转运状态映射：存储值 => 展示名（支持英文码与中文标签双向匹配）
     */
    private const STATUS_LABELS = [
        'TRANSFER_PENDING' => '待转运',
        'TRANSFER_CONFIRMED' => '已确认',
        'TRANSFER_REJECTED' => '已拒绝',
        'TRANSFER_CANCELLED' => '已取消',
        'TRANSPORTING' => '转运中',
        'ARRIVED' => '已到院',
        'HANDOVER' => '已交接',
        'TRANSFER_ARRIVED' => '已到院',
        'TRANSFER_HANDOVER' => '已交接',
        'TRANSFER_COMPLETED' => '已完成',
    ];

    /**
     * 转运任务详情（§3.11）
     */
    public function detail(string $transferNo): array
    {
        $transfer = Transfer::query()->with(['vehicle', 'patient'])->where('transfer_code', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        [$status, $statusLabel] = $this->status($transfer->transfer_status);

        return [
            'transferNo' => $transfer->transfer_code,
            'patientId' => $transfer->patient_id === null ? null : (string) $transfer->patient_id,
            'patientName' => $transfer->patient?->real_name ?? '',
            'vehicleId' => $vehicle?->vehicle_id ?? ($transfer->vehicle_id === null ? null : (string) $transfer->vehicle_id),
            'vehiclePlate' => $vehicle?->plate_number ?? '',
            'status' => $status,
            'statusLabel' => $statusLabel,
            'fromInstitutionId' => $transfer->from_institution_id,
            'toInstitutionId' => $transfer->to_institution_id,
            'doctorId' => $transfer->doctor_id,
            'nurseId' => $transfer->nurse_id,
            'startedAt' => $transfer->started_at?->toIso8601String(),
            'arrivedAt' => $transfer->arrived_at?->toIso8601String(),
            'handoverAt' => $transfer->handover_at?->toIso8601String(),
            'milestones' => $this->milestones($transferNo),
        ];
    }

    /**
     * 轨迹回放（§3.2）
     */
    public function track(string $transferNo, array $filters): array
    {
        $transfer = Transfer::query()->with('vehicle')->where('transfer_code', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        $vehicleId = $vehicle?->vehicle_id ?? ($transfer->vehicle_id === null ? null : (string) $transfer->vehicle_id);

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
            'transferNo' => $transfer->transfer_code,
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
        $transfer = Transfer::query()->with(['vehicle', 'patient'])->where('transfer_code', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $vehicle = $transfer->vehicle;
        $patient = $transfer->patient;
        [$status, $statusLabel] = $this->status($transfer->transfer_status);

        // 体征表 patient_id 存 patient_code，优先取患者编码，缺失时回退主键字符串
        $patientId = $patient?->patient_code ?? ($transfer->patient_id === null ? null : (string) $transfer->patient_id);
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
            'transferNo' => $transfer->transfer_code,
            'patientId' => $patientId,
            'patientName' => $patient?->real_name ?? '',
            'vehicleId' => $vehicle?->vehicle_id ?? ($transfer->vehicle_id === null ? null : (string) $transfer->vehicle_id),
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
        $transfer = Transfer::query()->where('transfer_code', $transferNo)->first();
        $this->assert($transfer !== null, ResponseCode::NOT_FOUND, '转运任务不存在');

        $list = Handover::query()
            ->where('transfer_no', $transferNo)
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
            'transferNo' => $transfer->transfer_code,
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
     * 状态码与展示名归一化
     */
    private function status(?string $raw): array
    {
        $raw = (string) $raw;

        if ($raw === '') {
            return ['', ''];
        }

        if (isset(self::STATUS_LABELS[$raw])) {
            return [$raw, self::STATUS_LABELS[$raw]];
        }

        $code = array_search($raw, self::STATUS_LABELS, true);
        if ($code !== false) {
            return [$code, $raw];
        }

        return [$raw, $raw];
    }
}
