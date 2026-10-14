<?php

namespace App\Services;

use App\Models\Bed;
use App\Models\EmergencyEvent;
use App\Models\Organization;
use App\Models\Transfer;
use App\Models\Vehicle;
use App\Models\VehicleLocation;

/**
 * 县域地图聚合（§11.1）：协同节点、节点连线、在途车辆点位
 *
 * 说明：本项目未建 collab_nodes / collab_links 表，节点由 organizations 派生，
 * 连线由 transfers 的转出/转入机构聚合，车辆点位复用 vehicles 实时位置。
 */
class CountyMapService extends Service
{
    private const STATUS_CODES = [
        0 => 'STANDBY',
        1 => 'DISPATCHING',
        2 => 'ON_SCENE',
        3 => 'RETURNING',
    ];

    /** 前端演示 region 与库内 county_name 的对应（避免 dafang/weiyuan 直传导致 404） */
    private function regionKeyword(?string $region): ?string
    {
        if ($region === null || $region === '') {
            return null;
        }
        $key = strtolower(trim($region));
        $aliases = [
            'dafang' => '大方',
            'weiyuan' => '威远',
        ];

        return $aliases[$key] ?? $region;
    }

    public function index(array $filters): array
    {
        $region = $filters['region'] ?? null;
        $withVehicles = (bool) ($filters['withVehicles'] ?? true);
        $requestedRegion = is_string($region) && $region !== '' ? $region : null;
        $keyword = $this->regionKeyword($requestedRegion);

        $baseQuery = Organization::query()
            ->whereNotNull('lng')
            ->whereNotNull('lat');

        $nodeQuery = clone $baseQuery;

        if ($keyword !== null) {
            $nodeQuery->where(function ($q) use ($keyword, $requestedRegion) {
                $q->where('org_code', $requestedRegion)
                    ->orWhere('county_name', 'like', "%{$keyword}%");
            });
        }

        $orgs = $nodeQuery->orderBy('tier')->orderBy('org_code')->get();

        // 大方等演示 region 库内暂无机构时：返回全量节点，避免大屏 404 打断
        if ($orgs->isEmpty() && $keyword !== null) {
            $orgs = $baseQuery->orderBy('tier')->orderBy('org_code')->get();
        }

        // 今日急诊数（按受理机构聚合）
        $erByOrg = EmergencyEvent::query()
            ->whereDate('occurred_at', now()->toDateString())
            ->whereNotNull('accept_org_id')
            ->selectRaw('accept_org_id, COUNT(*) as total')
            ->groupBy('accept_org_id')
            ->pluck('total', 'accept_org_id');

        // 床位聚合（按机构）
        $bedStats = Bed::query()
            ->selectRaw('institution_id, COUNT(*) as total, SUM(status = 0) as free, SUM(status = 1) as occupied')
            ->groupBy('institution_id')
            ->get()
            ->keyBy('institution_id');

        $nodes = $orgs->map(function (Organization $org) use ($erByOrg, $bedStats) {
            $total = (int) ($bedStats[$org->org_code]->total ?? 0);
            $free = (int) ($bedStats[$org->org_code]->free ?? 0);
            $occupied = (int) ($bedStats[$org->org_code]->occupied ?? 0);

            return [
                'id' => $org->org_code,
                'name' => $org->org_name,
                'tier' => (int) $org->tier,
                'lng' => $org->lng === null ? null : (float) $org->lng,
                'lat' => $org->lat === null ? null : (float) $org->lat,
                'er' => (int) ($erByOrg[$org->id] ?? 0),
                'bedsFree' => $free,
                'tight' => $total > 0 && $occupied / $total >= 0.9,
            ];
        })->values()->all();

        $links = $this->links($orgs->pluck('org_code')->all());
        $vehicles = $withVehicles ? $this->vehicles() : [];

        return [
            'updatedAt' => now()->toIso8601String(),
            'region' => $requestedRegion ?? 'weiyuan',
            'regionMatched' => $keyword !== null && $orgs->isNotEmpty(),
            'erToday' => EmergencyEvent::query()->whereDate('occurred_at', now()->toDateString())->count(),
            'nodes' => $nodes,
            'links' => $links,
            'vehicles' => $vehicles,
        ];
    }

    /**
     * 节点连线：按转出/转入机构聚合转诊量（flow）
     */
    private function links(array $nodeCodes): array
    {
        $rows = Transfer::query()
            ->selectRaw('source_institution_id, target_institution_id, COUNT(*) as flow')
            ->groupBy('source_institution_id', 'target_institution_id')
            ->get();

        return $rows->map(fn ($row) => [
            'from' => $row->source_institution_id,
            'to' => $row->target_institution_id,
            'flow' => (int) $row->flow,
        ])->filter(fn ($l) => in_array($l['from'], $nodeCodes, true)
                && in_array($l['to'], $nodeCodes, true))
            ->values()->all();
    }

    /**
     * 在途车辆点位
     */
    private function vehicles(): array
    {
        return Vehicle::query()
            ->where('status', '!=', 0)
            ->orderBy('plate_number')
            ->get()
            ->map(function (Vehicle $vehicle) {
                $location = VehicleLocation::query()
                    ->where('vehicle_id', $vehicle->vehicle_id)
                    ->orderByDesc('located_at')
                    ->first();

                return [
                    'id' => $vehicle->vehicle_id !== null && $vehicle->vehicle_id !== ''
                        ? $vehicle->vehicle_id
                        : (string) $vehicle->id,
                    'plate' => $vehicle->plate_number,
                    'status' => self::STATUS_CODES[(int) $vehicle->status] ?? self::STATUS_CODES[0],
                    'lng' => (float) ($location->lng ?? $vehicle->latest_lng ?? 0),
                    'lat' => (float) ($location->lat ?? $vehicle->latest_lat ?? 0),
                    'etaMinutes' => $location?->eta_minutes,
                ];
            })->values()->all();
    }
}
