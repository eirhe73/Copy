<?php

namespace App\Services;

use App\Models\Bed;
use App\Models\ConsultSession;
use App\Models\EmergencyEvent;
use App\Models\EmergencyPatient;
use App\Models\Handover;
use App\Models\IcuBed;
use App\Models\Transfer;
use App\Models\Vehicle;
use App\Models\Warning;
use Illuminate\Database\Eloquent\Builder;

/**
 * 指挥大屏总览聚合（§3.1~3.4）：KPI 摘要、实时事件流、调度概览、重症趋势
 *
 * 说明：所有聚合均取自既有业务表；事件流按业务事件类型从各来源表合并，
 * 趋势按预警类别（NEWS/CRITICAL_VALUE/VASOACTIVE/COAG）映射为 news/critical/drug/coag。
 */
class DashboardService extends Service
{
    /** 事件状态：存储值 => [枚举名, 展示名]（与 emergency_events 一致） */
    private const STATUS_LABELS = [
        0 => ['STANDBY', '待命'],
        1 => ['DISPATCHING', '出警中'],
        2 => ['ON_SCENE', '现场处置'],
        3 => ['RETURNING', '返院途中'],
    ];

    /** 事件等级：存储值 => [枚举名, 展示名] */
    private const LEVEL_LABELS = [
        0 => ['CRITICAL', '重症'],
        1 => ['ACUTE', '急症'],
        2 => ['GENERAL', '一般'],
    ];

    /** 事件流类型枚举（§4.1） */
    private const EVENT_TYPE_LABELS = [
        'registered' => '患者登记',
        'transfer' => '转运/转诊',
        'warning' => '预警',
        'consultation' => '会诊',
        'handover' => '到院交接',
    ];

    private const TREND_METRIC_KEYS = ['news', 'critical', 'drug', 'coag'];

    /** 预警类别 => 趋势指标键 */
    private const TREND_CATEGORY_MAP = [
        'NEWS' => 'news',
        'CRITICAL_VALUE' => 'critical',
        'VASOACTIVE' => 'drug',
        'COAG' => 'coag',
    ];

    public function __construct(private readonly CountyMapService $countyMap)
    {
    }

    /**
     * §3.1 一体化指挥总览：一次返回首页四面板聚合
     */
    public function overview(array $filters): array
    {
        $bed = $this->bedStats();
        $map = $this->countyMap->index([
            'region' => $filters['region'] ?? null,
            'withVehicles' => true,
        ]);

        $days = min(90, max(1, (int) ($filters['trendDays'] ?? 30)));

        return [
            'updatedAt' => now()->toIso8601String(),
            'kpi' => $this->kpiCounters($bed, false),
            'dispatch' => $this->dispatchCounters(),
            'map' => [
                'region' => $map['region'],
                'erToday' => $map['erToday'],
                'nodeCount' => count($map['nodes']),
                'vehicleCount' => count($map['vehicles']),
                'linkCount' => count($map['links']),
            ],
            'beds' => $bed,
            'eventStream' => array_slice($this->sortedEvents(), 0, 10),
            'trend' => $this->trend($days),
        ];
    }

    /**
     * §3.2 KPI 指标墙：逐项附带环比与单位
     */
    public function kpi(array $filters): array
    {
        $last24h = ($filters['scope'] ?? 'today') === '24h';
        $counters = $this->kpiCounters($this->bedStats(), $last24h);
        $prev = $this->statusCounts(EmergencyEvent::query()->whereDate('occurred_at', now()->subDay()->toDateString()));

        return [
            'updatedAt' => now()->toIso8601String(),
            'items' => [
                $this->kpiItem('activeEvents', '今日急救事件', $counters['activeEvents'], '件', 'primary', $this->rate($counters['activeEvents'], $prev['active'])),
                $this->kpiItem('transporting', '在途转运', $counters['transporting'], '辆', 'primary', 0.0),
                $this->kpiItem('pendingAlerts', '预警待处置', $counters['pendingAlerts'], '条', 'warning', 0.0),
                $this->kpiItem('bedsOccupancyRate', '床位占用率', (int) round($counters['bedsOccupancyRate'] * 100), '%', 'warning', 0.0),
                $this->kpiItem('criticalPatients', '重症在治患者', $counters['criticalPatients'], '人', 'danger', 0.0),
                $this->kpiItem('erToday', '县域今日急诊', $counters['erToday'], '人次', 'primary', $this->rate($counters['erToday'], $prev['total'])),
            ],
        ];
    }

    /**
     * §3.3 实时事件流：合并多来源业务事件，按时间倒序分页
     */
    public function eventStream(array $filters): array
    {
        $entries = $this->sortedEvents();

        $types = $this->parseTypes($filters['type'] ?? null);
        if ($types !== null) {
            $entries = array_values(array_filter($entries, fn (array $e) => in_array($e['type'], $types, true)));
        }

        $entries = $this->afterCursor($entries, $filters['cursor'] ?? null);

        $pageNum = max(1, (int) ($filters['pageNum'] ?? 1));
        $pageSize = min(100, max(1, (int) ($filters['pageSize'] ?? 20)));

        return [
            'updatedAt' => now()->toIso8601String(),
            'total' => count($entries),
            'list' => array_values(array_slice($entries, ($pageNum - 1) * $pageSize, $pageSize)),
        ];
    }

    /**
     * §3.4 急救调度概览：进行中事件数、状态分布、车辆分布、事件简报
     */
    public function dispatchOverview(): array
    {
        $counts = $this->dispatchCounters();

        $breakdown = [];
        foreach ([1, 2, 3] as $status) {
            if ($counts['byStatus'][$status] > 0) {
                $breakdown[] = [
                    'status' => self::STATUS_LABELS[$status][0],
                    'statusLabel' => self::STATUS_LABELS[$status][1],
                    'count' => $counts['byStatus'][$status],
                ];
            }
        }

        return [
            'updatedAt' => now()->toIso8601String(),
            'activeCount' => $counts['active'],
            'statusBreakdown' => $breakdown,
            'vehicles' => [
                ['status' => 'STANDBY', 'statusLabel' => '待命', 'count' => Vehicle::query()->where('status', 0)->count()],
                ['status' => 'ON_TASK', 'statusLabel' => '执行任务', 'count' => Vehicle::query()->where('status', '!=', 0)->count()],
            ],
            'latest' => EmergencyEvent::query()
                ->whereDate('occurred_at', now()->toDateString())
                ->where('status', '>', 0)
                ->orderByDesc('started_at')
                ->limit(5)
                ->get()
                ->map(fn (EmergencyEvent $event) => $this->latestItem($event))
                ->values()->all(),
        ];
    }

    /**
     * 调度计数（今日）：总/进行中/出警中/现场处置/返院途中
     */
    private function dispatchCounters(): array
    {
        return $this->statusCounts(EmergencyEvent::query()->whereDate('occurred_at', now()->toDateString()));
    }

    /**
     * KPI 摘要计数
     */
    private function kpiCounters(array $bed, bool $last24h): array
    {
        $query = $last24h
            ? EmergencyEvent::query()->where('occurred_at', '>=', now()->subDay())
            : EmergencyEvent::query()->whereDate('occurred_at', now()->toDateString());
        $counts = $this->statusCounts($query);

        $total = $bed['total'];
        $occupied = $bed['occupied'];

        return [
            'activeEvents' => $counts['active'],
            'transporting' => Transfer::query()->where('status', Transfer::STATUS_IN_TRANSIT)->count(),
            'pendingAlerts' => Warning::query()->where('status', '!=', 'resolved')->count(),
            'occupiedBeds' => $occupied,
            'totalBeds' => $total,
            'bedsOccupancyRate' => $total > 0 ? round($occupied / $total, 2) : 0.0,
            'criticalPatients' => IcuBed::query()->where('status', 'occupied')->count(),
            'erToday' => $counts['total'],
        ];
    }

    /**
     * 按状态聚合事件计数
     */
    private function statusCounts(Builder $query): array
    {
        $byStatus = [0 => 0, 1 => 0, 2 => 0, 3 => 0];
        foreach ($query->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status') as $status => $total) {
            $byStatus[(int) $status] = (int) $total;
        }

        return [
            'byStatus' => $byStatus,
            'total' => array_sum($byStatus),
            'active' => $byStatus[1] + $byStatus[2] + $byStatus[3],
            'dispatched' => $byStatus[1],
            'onScene' => $byStatus[2],
            'returning' => $byStatus[3],
        ];
    }

    /**
     * 床位统计：总床 / 占用 / 可用（可用 = 总床 - 占用）
     */
    private function bedStats(): array
    {
        $row = Bed::query()
            ->where('enabled', true)
            ->selectRaw('COUNT(*) as total, SUM(status = 1) as occupied')
            ->first();

        $total = (int) ($row->total ?? 0);
        $occupied = (int) ($row->occupied ?? 0);

        return [
            'total' => $total,
            'occupied' => $occupied,
            'available' => max(0, $total - $occupied),
        ];
    }

    /**
     * 重症趋势：按天聚合预警类别计数
     */
    private function trend(int $days): array
    {
        $since = now()->subDays($days - 1)->startOfDay();

        $grouped = [];
        foreach (Warning::query()->where('occurred_at', '>=', $since)->get(['category', 'occurred_at']) as $row) {
            $key = self::TREND_CATEGORY_MAP[$row->category] ?? null;
            if ($key === null || $row->occurred_at === null) {
                continue;
            }
            $date = $row->occurred_at->format('m/d');
            $grouped[$date] ??= array_fill_keys(self::TREND_METRIC_KEYS, 0);
            $grouped[$date][$key]++;
        }

        $series = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('m/d');
            $series[] = array_merge(['date' => $date], $grouped[$date] ?? array_fill_keys(self::TREND_METRIC_KEYS, 0));
        }

        return ['metricKeys' => self::TREND_METRIC_KEYS, 'series' => $series];
    }

    /**
     * 合并各来源业务事件并按时间倒序
     */
    private function sortedEvents(): array
    {
        $entries = [];

        EmergencyPatient::query()->where('is_draft', false)->get()->each(function (EmergencyPatient $p) use (&$entries) {
            $entries[] = $this->entry('registered', $p->patient_no, $p->patient_no, $p->name, "{$p->name} 已登记；{$p->chief_complaint}", null, $p->created_at);
        });

        Transfer::query()->with('patient')->get()->each(function (Transfer $t) use (&$entries) {
            $entries[] = $this->entry('transfer', $t->transfer_id, $t->patient_id, $t->patient?->name ?? '', "转诊单 {$t->transfer_id}：{$t->reason}", null, $t->created_at);
        });

        Warning::query()->get()->each(function (Warning $w) use (&$entries) {
            $entries[] = $this->entry('warning', $w->warning_no, $w->patient_id, $w->patient_label, "{$w->title}（{$w->patient_label}）", null, $w->occurred_at);
        });

        ConsultSession::query()->get()->each(function (ConsultSession $c) use (&$entries) {
            $entries[] = $this->entry('consultation', $c->session_id, $c->patient_id, $c->patient_name, "会诊 {$c->patient_name}：{$c->source_department} → {$c->department}", $c->accepted_by, $c->created_at);
        });

        Handover::query()->get()->each(function (Handover $h) use (&$entries) {
            $entries[] = $this->entry('handover', $h->handover_no, $h->patient_id, $h->patient_name, "{$h->patient_name} 到院交接（{$h->to_dept}）", $h->to_staff_id, $h->handover_at ?? $h->created_at);
        });

        usort($entries, fn (array $a, array $b) => strcmp((string) $b['at'], (string) $a['at']));

        return $entries;
    }

    /**
     * 构造一条事件流记录
     */
    private function entry(string $type, string $id, ?string $patientId, string $patientName, string $note, ?string $actorId, mixed $at): array
    {
        return [
            'id' => $id,
            'patientId' => $patientId,
            'patientName' => $patientName,
            'type' => $type,
            'typeLabel' => self::EVENT_TYPE_LABELS[$type] ?? $type,
            'note' => $note,
            'actorId' => $actorId,
            'at' => $at?->toIso8601String(),
        ];
    }

    /**
     * 游标过滤：仅保留时间晚于游标事件的条目
     */
    private function afterCursor(array $entries, mixed $cursor): array
    {
        if ($cursor === null || $cursor === '') {
            return $entries;
        }

        foreach ($entries as $entry) {
            if ($entry['id'] === (string) $cursor) {
                return array_values(array_filter($entries, fn (array $e) => strcmp((string) $e['at'], (string) $entry['at']) > 0));
            }
        }

        return $entries;
    }

    /**
     * 解析逗号分隔的事件类型；无有效类型时返回空集（不过滤时返回 null）
     */
    private function parseTypes(mixed $raw): ?array
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        $names = array_filter(array_map('trim', explode(',', (string) $raw)));

        return array_values(array_intersect($names, array_keys(self::EVENT_TYPE_LABELS)));
    }

    /**
     * KPI 单项（value/unit/rate/tone）
     */
    private function kpiItem(string $key, string $title, int $value, string $unit, string $tone, float $rate): array
    {
        return [
            'key' => $key,
            'title' => $title,
            'value' => $value,
            'unit' => $unit,
            'rate' => $rate,
            'tone' => $tone,
        ];
    }

    /**
     * 环比：(本期 - 上期) / 上期，上期为 0 时返回 0
     */
    private function rate(int $current, int $previous): float
    {
        return $previous > 0 ? round(($current - $previous) / $previous, 2) : 0.0;
    }

    /**
     * 事件简报（dispatch-overview.latest）
     */
    private function latestItem(EmergencyEvent $event): array
    {
        $level = (int) $event->level;
        $status = (int) $event->status;

        return [
            'eventId' => $event->event_code,
            'task120Id' => $event->task120_id,
            'level' => self::LEVEL_LABELS[$level][0] ?? 'GENERAL',
            'levelLabel' => self::LEVEL_LABELS[$level][1] ?? '',
            'chiefComplaint' => $event->chief,
            'pickupAddress' => $event->scene_address,
            'destination' => $event->destination,
            'vehiclePlate' => $event->vehicle_plate,
            'status' => self::STATUS_LABELS[$status][0] ?? 'STANDBY',
            'etaHospitalMinutes' => (int) $event->eta_hospital_minutes,
        ];
    }
}
