<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\CriticalValue;
use App\Models\Department;
use App\Models\Patient;
use App\Models\Warning;
use App\Models\WarningClosedLoop;
use App\Models\WarningDisposeRecord;
use App\Models\WarningTrend;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * 急救监控 · 预警通知业务服务
 */
class WarningService extends Service
{
    private const CATEGORY_LABELS = [
        'NEWS' => 'NEWS 评分预警',
        'CRITICAL_VALUE' => '检验危急值',
        'VASOACTIVE' => '血管活性药物',
        'COAG' => '凝血指标异常',
    ];

    private const LEVEL_LABELS = [
        'urgent' => '紧急',
        'warning' => '关注',
    ];

    private const STATUS_LABELS = [
        'new' => '待确认',
        'acknowledged' => '已确认',
        'treating' => '处置中',
        'resolved' => '已闭环',
    ];

    private const CRITICAL_STATUS_LABELS = [
        'pending' => '未处理',
        'notified' => '已通知',
        'handled' => '已处理',
    ];

    /** 处置闭环四阶段（顺序即漏斗顺序） */
    private const STAGES = ['预警触发', '护士确认', '医生到床', '干预完成'];

    /** 阶段完成后的预警状态推断 */
    private const STAGE_STATUS = [
        '预警触发' => 'new',
        '护士确认' => 'acknowledged',
        '医生到床' => 'treating',
        '干预完成' => 'resolved',
    ];

    /**
     * §3.1 预警摘要、趋势与闭环
     */
    public function summary(array $filters): array
    {
        $since = now()->subDay();

        $counts = $this->closedLoopCountsForSummary();

        $summary24h = [
            'activeAlerts' => Warning::query()
                ->where('occurred_at', '>=', $since)
                ->where('status', '!=', 'resolved')
                ->count(),
            'newsAttention' => Warning::query()
                ->where('occurred_at', '>=', $since)
                ->where('category', 'NEWS')
                ->where('level', 'warning')
                ->count(),
            'criticalValue' => CriticalValue::query()
                ->where('reported_at', '>=', $since)
                ->count(),
            'closedLoopPercent' => $this->closedLoopPercent($counts),
        ];

        $trends = WarningTrend::query()
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (WarningTrend $t) => [
                'id' => $t->trend_id,
                'patientLabel' => $t->patient_label,
                'metric' => $t->metric,
                'current' => (float) $t->current_value,
                'predicted' => (float) $t->predicted_value,
                'withinMinutes' => (int) $t->within_minutes,
                'note' => $t->note,
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'summary24h' => $summary24h,
            'trends' => $trends,
            'closedLoop' => $this->stageList($counts),
        ];
    }

    /**
     * §3.2 预警列表（分页）
     */
    public function paginate(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 10), 1), 100);

        $query = $this->warningBaseQuery($filters);

        $activeCount = (clone $query)
            ->whereIn('status', ['new', 'acknowledged', 'treating'])
            ->count();

        $status = $filters['status'] ?? null;
        if ($status) {
            $statusList = array_filter(array_map('trim', explode(',', (string) $status)));
            if ($statusList) {
                $query->whereIn('status', $statusList);
            }
        }

        $paginator = $query
            ->orderByDesc('occurred_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (Warning $w) => $this->warningListItem($w))
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'activeCount' => $activeCount,
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * §3.3 预警详情（含处置闭环时间轴）
     */
    public function detail(string $id): array
    {
        $warning = $this->findWarning($id);

        $records = $warning->disposeRecords()
            ->orderBy('acted_at')
            ->get()
            ->map(fn (WarningDisposeRecord $r) => [
                'stage' => $r->stage,
                'note' => $r->note,
                'actorName' => $r->actor_name,
                'actedAt' => $r->acted_at?->toIso8601String(),
            ])
            ->all();

        return array_merge($this->warningListItem($warning), [
            'patient' => $this->patientInfo($warning),
            'records' => $records,
        ]);
    }

    /**
     * §3.4 预警处置（闭环上报）
     */
    public function dispose(string $id, array $data): array
    {
        $warning = $this->findWarning($id);

        $this->assert($warning->status !== 'resolved', ResponseCode::BAD_REQUEST, '预警已闭环，无法重复上报');

        $stage = (string) $data['stage'];
        $this->assert(in_array($stage, self::STAGES, true), ResponseCode::BAD_REQUEST, '非法的处置阶段');

        // §5 闭环阶段单向推进：允许跳过、不允许回退；同一阶段重复上报按 400 处理（幂等）
        $latestIndex = $warning->disposeRecords()
            ->pluck('stage')
            ->map(fn (string $s) => array_search($s, self::STAGES, true))
            ->reject(fn ($i) => $i === false)
            ->max();
        $stageIndex = array_search($stage, self::STAGES, true);

        $this->assert(
            $latestIndex === null || $stageIndex > $latestIndex,
            ResponseCode::BAD_REQUEST,
            '处置阶段不允许回退或重复上报'
        );

        $status = $data['nextStatus'] ?? self::STAGE_STATUS[$stage];
        $actedAt = now();

        DB::transaction(function () use ($warning, $stage, $data, $status, $actedAt) {
            WarningDisposeRecord::create([
                'warning_id' => $warning->id,
                'warning_no' => $warning->warning_no,
                'stage' => $stage,
                'note' => $data['note'] ?? '',
                'actor_id' => $data['actorId'] ?? '',
                'actor_name' => $data['actorName'] ?? '',
                'acted_at' => $actedAt,
            ]);

            $warning->update(['status' => $status]);
        });

        return [
            'warningNo' => $warning->warning_no,
            'stage' => $stage,
            'status' => $status,
            'statusLabel' => $this->statusLabel($status),
            'actedAt' => $actedAt->toIso8601String(),
            'closedLoopPercent' => $this->closedLoopPercent($this->closedLoopCountsForSummary()),
        ];
    }

    /**
     * §3.5 预警统计
     */
    public function statistics(array $filters): array
    {
        [$start, $end] = $this->resolveRange($filters);

        $base = Warning::query()->whereBetween('occurred_at', [$start, $end]);

        $total = (clone $base)->count();
        $resolved = (clone $base)->where('status', 'resolved')->count();
        $pending = (clone $base)->where('status', '!=', 'resolved')->count();

        $funnel = $this->stageCounts($start->toDateString(), $end->toDateString());
        $closedLoopPercent = ($funnel['预警触发'] ?? 0) > 0
            ? $this->closedLoopPercent($funnel)
            : ($total > 0 ? (int) round($resolved / $total * 100) : 0);

        return [
            'updatedAt' => now()->toIso8601String(),
            'summary' => [
                'total' => $total,
                'today' => Warning::query()->whereDate('occurred_at', now()->toDateString())->count(),
                'pending' => $pending,
                'closedLoopPercent' => $closedLoopPercent,
                'avgDisposeMinutes' => $this->avgDisposeMinutes($start, $end),
            ],
            'byCategory' => $this->groupCount($base, 'category', 'category', self::CATEGORY_LABELS, 'categoryLabel'),
            'byLevel' => $this->groupCount($base, 'level', 'level', self::LEVEL_LABELS, 'levelLabel'),
            'dailyTrend' => $this->dailyTrend($start, $end),
        ];
    }

    /**
     * §3.6 检验危急值列表（分页）
     */
    public function criticalValues(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $query = CriticalValue::query()
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['level'] ?? null, fn ($q, $v) => $q->where('level', $v))
            ->when($filters['keyword'] ?? null, fn ($q, $v) => $q->where(
                fn ($sub) => $sub->where('item_name', 'like', "%{$v}%")
                    ->orWhere('patient_label', 'like', "%{$v}%")
            ));

        $paginator = $query
            ->orderByDesc('reported_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (CriticalValue $c) => [
                'criticalNo' => $c->critical_no,
                'patientId' => $c->patient_id,
                'patientLabel' => $c->patient_label,
                'itemName' => $c->item_name,
                'resultValue' => $c->result_value,
                'unit' => $c->unit,
                'refRange' => $c->ref_range,
                'criticalRange' => $c->critical_range,
                'specimen' => $c->specimen,
                'level' => $c->level,
                'levelLabel' => $this->levelLabel($c->level),
                'status' => $c->status,
                'statusLabel' => self::CRITICAL_STATUS_LABELS[$c->status] ?? $c->status,
                'reportedAt' => $c->reported_at?->toIso8601String(),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * §3.7 处置闭环明细
     */
    public function closedLoop(array $filters): array
    {
        $stage = $filters['stage'] ?? null;
        if ($stage !== null) {
            $this->assert(in_array($stage, self::STAGES, true), ResponseCode::BAD_REQUEST, '非法的处置阶段');
        }

        $from = $filters['startDate'] ?? null;
        $to = $filters['endDate'] ?? null;
        $counts = $this->stageCounts($from, $to);

        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $columns = [
            'warning_dispose_records.warning_no as warning_no',
            'warnings.patient_label as patient_label',
            'warnings.title as title',
            'warning_dispose_records.stage as stage',
            'warning_dispose_records.actor_name as actor_name',
            'warning_dispose_records.acted_at as acted_at',
            'warning_dispose_records.note as note',
        ];

        $query = WarningDisposeRecord::query()
            ->join('warnings', 'warnings.id', '=', 'warning_dispose_records.warning_id')
            ->when($stage, fn ($q, $v) => $q->where('warning_dispose_records.stage', $v))
            ->when($from, fn ($q, $v) => $q->where('warning_dispose_records.acted_at', '>=', Carbon::parse($v)->startOfDay()))
            ->when($to, fn ($q, $v) => $q->where('warning_dispose_records.acted_at', '<=', Carbon::parse($v)->endOfDay()))
            ->orderByDesc('warning_dispose_records.acted_at');

        $paginator = $query->paginate($pageSize, $columns, 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn ($r) => [
                'warningNo' => $r->warning_no,
                'patientLabel' => $r->patient_label,
                'title' => $r->title,
                'stage' => $r->stage,
                'actorName' => $r->actor_name,
                'actedAt' => $r->acted_at ? Carbon::parse($r->acted_at)->toIso8601String() : null,
                'note' => $r->note,
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'stages' => $this->stageList($counts),
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * 列表项字段（供 §3.2 / §3.3 复用）
     */
    private function warningListItem(Warning $w): array
    {
        return [
            'warningNo' => $w->warning_no,
            'patientId' => $w->patient_id,
            'patientLabel' => $w->patient_label,
            'category' => $w->category,
            'categoryLabel' => $this->categoryLabel($w->category),
            'title' => $w->title,
            'metric' => $w->metric,
            'currentValue' => $w->current_value === null ? null : (float) $w->current_value,
            'threshold' => $w->threshold,
            'level' => $w->level,
            'levelLabel' => $this->levelLabel($w->level),
            'status' => $w->status,
            'statusLabel' => $this->statusLabel($w->status),
            'occurredAt' => $w->occurred_at?->toIso8601String(),
        ];
    }

    /**
     * 详情页患者摘要
     */
    private function patientInfo(Warning $warning): array
    {
        $patient = Patient::query()->where('patient_id', $warning->patient_id)->first();

        return [
            'name' => $patient?->name,
            'gender' => $patient?->gender,
            'age' => $patient?->age,
            'departmentName' => $this->departmentName($warning->department_id),
        ];
    }

    private function departmentName(?string $departmentId): ?string
    {
        if (! $departmentId) {
            return null;
        }

        $query = Department::query()->where('dept_code', $departmentId);
        if (ctype_digit($departmentId)) {
            $query->orWhere('id', (int) $departmentId);
        }

        return $query->value('dept_name');
    }

    /**
     * §3.2 公共过滤（供列表与进行中计数复用）
     */
    private function warningBaseQuery(array $filters)
    {
        return Warning::query()
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->when($filters['level'] ?? null, fn ($q, $v) => $q->where('level', $v))
            ->when($filters['institutionId'] ?? null, fn ($q, $v) => $q->where('institution_id', $v))
            ->when($filters['departmentId'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->when($filters['keyword'] ?? null, fn ($q, $v) => $q->where(
                fn ($sub) => $sub->where('patient_label', 'like', "%{$v}%")
                    ->orWhere('title', 'like', "%{$v}%")
            ))
            ->when($filters['startDate'] ?? null, fn ($q, $v) => $q->whereDate('occurred_at', '>=', $v))
            ->when($filters['endDate'] ?? null, fn ($q, $v) => $q->whereDate('occurred_at', '<=', $v));
    }

    /**
     * 按 stage 聚合 warning_closed_loop 计数（可限定统计日期范围）
     */
    private function stageCounts(?string $from = null, ?string $to = null): array
    {
        $rows = WarningClosedLoop::query()
            ->when($from, fn ($q, $v) => $q->whereDate('stat_date', '>=', $v))
            ->when($to, fn ($q, $v) => $q->whereDate('stat_date', '<=', $v))
            ->groupBy('stage')
            ->selectRaw('stage, SUM(`count`) as aggregate')
            ->get();

        return $rows->pluck('aggregate', 'stage')->map(fn ($v) => (int) $v)->all();
    }

    /**
     * 摘要用闭环计数：优先当日，无数据时回退最近统计日
     */
    private function closedLoopCountsForSummary(): array
    {
        $today = now()->toDateString();
        $counts = $this->stageCounts($today, $today);

        if (array_sum($counts) === 0) {
            $latest = WarningClosedLoop::query()->max('stat_date');
            if ($latest) {
                $date = Carbon::parse($latest)->toDateString();
                $counts = $this->stageCounts($date, $date);
            }
        }

        return $counts;
    }

    private function stageList(array $counts): array
    {
        return array_map(
            fn (string $stage) => ['stage' => $stage, 'count' => $counts[$stage] ?? 0],
            self::STAGES
        );
    }

    private function closedLoopPercent(array $counts): int
    {
        $trigger = $counts['预警触发'] ?? 0;
        $done = $counts['干预完成'] ?? 0;

        return $trigger > 0 ? (int) round($done / $trigger * 100) : 0;
    }

    private function levelLabel(string $level): string
    {
        return self::LEVEL_LABELS[$level] ?? $level;
    }

    private function statusLabel(string $status): string
    {
        return self::STATUS_LABELS[$status] ?? $status;
    }

    private function categoryLabel(string $category): string
    {
        return self::CATEGORY_LABELS[$category] ?? $category;
    }

    /**
     * 统计时间范围：range 与 startDate/endDate 二选一，缺省近 30 日
     */
    private function resolveRange(array $filters): array
    {
        if (($filters['startDate'] ?? null) || ($filters['endDate'] ?? null)) {
            $start = Carbon::parse($filters['startDate'] ?? now()->subDays(29)->toDateString())->startOfDay();
            $end = Carbon::parse($filters['endDate'] ?? now()->toDateString())->endOfDay();

            return [$start, $end];
        }

        return match ($filters['range'] ?? null) {
            'day' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            default => [now()->subDays(29)->startOfDay(), now()->endOfDay()],
        };
    }

    private function groupCount($base, string $column, string $key, array $labels, string $labelKey): array
    {
        $rows = (clone $base)
            ->selectRaw("{$column} as grp, COUNT(*) as aggregate")
            ->groupBy($column)
            ->get();

        $counts = $rows->pluck('aggregate', 'grp')->map(fn ($v) => (int) $v)->all();

        return array_map(
            fn ($k, $label) => [$key => $k, $labelKey => $label, 'count' => $counts[$k] ?? 0],
            array_keys($labels),
            array_values($labels)
        );
    }

    private function dailyTrend(Carbon $start, Carbon $end): array
    {
        $map = [
            'NEWS' => 'news',
            'CRITICAL_VALUE' => 'critical',
            'VASOACTIVE' => 'drug',
            'COAG' => 'coag',
        ];

        $buckets = [];
        Warning::query()
            ->whereBetween('occurred_at', [$start, $end])
            ->get(['occurred_at', 'category'])
            ->each(function (Warning $w) use (&$buckets, $map) {
                $key = $map[$w->category] ?? null;
                if ($key === null || $w->occurred_at === null) {
                    return;
                }
                $date = $w->occurred_at->toDateString();
                $buckets[$date][$key] = ($buckets[$date][$key] ?? 0) + 1;
            });

        $out = [];
        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $date = $day->toDateString();
            $bucket = $buckets[$date] ?? [];
            $out[] = [
                'date' => $day->format('m/d'),
                'news' => $bucket['news'] ?? 0,
                'critical' => $bucket['critical'] ?? 0,
                'drug' => $bucket['drug'] ?? 0,
                'coag' => $bucket['coag'] ?? 0,
            ];
        }

        return $out;
    }

    /**
     * 「干预完成」平均处置时长（分钟）
     */
    private function avgDisposeMinutes(Carbon $start, Carbon $end): int
    {
        $rows = WarningDisposeRecord::query()
            ->join('warnings', 'warnings.id', '=', 'warning_dispose_records.warning_id')
            ->where('warning_dispose_records.stage', '干预完成')
            ->whereBetween('warning_dispose_records.acted_at', [$start, $end])
            ->get([
                'warnings.occurred_at as w_occurred_at',
                'warning_dispose_records.acted_at as r_acted_at',
            ]);

        if ($rows->isEmpty()) {
            return 0;
        }

        $sum = 0;
        foreach ($rows as $row) {
            $sum += max((int) Carbon::parse($row->w_occurred_at)->diffInMinutes(Carbon::parse($row->r_acted_at)), 0);
        }

        return (int) round($sum / $rows->count());
    }

    /**
     * 兼容 warnings.id 与 warning_no
     */
    private function findWarning(string $id): Warning
    {
        $warning = Warning::query()->where('warning_no', $id)->first();

        if (! $warning && ctype_digit($id)) {
            $warning = Warning::query()->find((int) $id);
        }

        $this->assert($warning instanceof Warning, ResponseCode::NOT_FOUND, '预警不存在');

        return $warning;
    }
}
