<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Exceptions\BusinessException;
use App\Models\Department;
use App\Models\Organization;
use App\Models\QcRectify;
use App\Models\QcRectifyLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * 质控整改单业务服务：台账 / 详情 / 四态流转日志 / 报表聚合
 */
class RectifyService extends Service
{
    private const SOURCE_LABELS = [
        'alert' => '规则预警',
        'pathwayTimeout' => '绿色通道超时',
        'inspection' => '质控检查',
        'complaint' => '投诉反馈',
        'manual' => '人工登记',
    ];

    private const LEVEL_LABELS = [1 => '严重', 2 => '一般', 3 => '轻微'];

    private const STATUS_LABELS = [
        'pending' => '待整改',
        'rectifying' => '整改中',
        'reviewing' => '待复评',
        'closed' => '已销号',
    ];

    private const ACTION_LABELS = [
        'start' => '开始整改',
        'submit' => '提交复评',
        'approve' => '复评通过并销号',
        'reject' => '退回整改',
    ];

    /** 流转状态机：动作 => [允许的前置状态列表, 目标状态] */
    private const TRANSITIONS = [
        'start' => [['pending'], 'rectifying'],
        'submit' => [['rectifying'], 'reviewing'],
        'approve' => [['reviewing'], 'closed'],
        'reject' => [['reviewing'], 'rectifying'],
    ];

    /** 报表目录（规范设计，静态配置） */
    private const REPORT_DEFS = [
        ['key' => 'rectify', 'name' => '质控整改台账', 'category' => '质控', 'content' => '全部质量问题的登记、整改、复评与销号记录', 'dimension' => '不限', 'exportable' => true],
        ['key' => 'responseTime', 'name' => '急救时效统计', 'category' => '时效', 'content' => '到院反应时长、现场处置时长、转运时长的分位统计', 'dimension' => '日 / 周', 'exportable' => false],
    ];

    /**
     * §5.4 整改台账（summary + total + list）
     */
    public function ledger(array $filters): array
    {
        $query = $this->filterQuery($filters);

        // 汇总统计（不受分页影响）
        $total = (clone $query)->count();
        $overdue = (clone $query)->where('status', '!=', 'closed')->where('deadline', '<', now())->count();
        $levelDist = (clone $query)->selectRaw('level, COUNT(*) as c')
            ->groupBy('level')->pluck('c', 'level')->map(fn ($c) => (int) $c)->all();

        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $paginator = (clone $query)->orderByDesc('found_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $items = $paginator->getCollection();
        $orgNames = $this->orgNames($items->pluck('owner_org')->all());
        $deptNames = $this->deptNames($items->pluck('owner_dept')->all());

        $list = $items->map(fn (QcRectify $r) => [
            'id' => $r->rectify_id,
            'title' => $r->title,
            'source' => $r->source,
            'sourceLabel' => self::SOURCE_LABELS[$r->source] ?? $r->source,
            'level' => (int) $r->level,
            'levelLabel' => self::LEVEL_LABELS[$r->level] ?? (string) $r->level,
            'status' => $r->status,
            'statusLabel' => self::STATUS_LABELS[$r->status] ?? $r->status,
            'ownerName' => $r->owner_name,
            'ownerOrg' => $r->owner_org,
            'ownerOrgName' => $orgNames[$r->owner_org] ?? $r->owner_org,
            'ownerDept' => $r->owner_dept,
            'ownerDeptName' => $deptNames[$r->owner_dept] ?? $r->owner_dept,
            'foundAt' => $r->found_at?->toIso8601String(),
            'deadline' => $r->deadline?->toIso8601String(),
            'closedAt' => $r->closed_at?->toIso8601String(),
            'overdue' => $this->isOverdue($r),
        ])->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'summary' => ['total' => $total, 'overdue' => $overdue, 'levelDist' => $levelDist],
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * §5.5 整改单详情（含流转日志）
     */
    public function detail(string $rectifyId): array
    {
        $rectify = QcRectify::query()->where('rectify_id', $rectifyId)->first();
        $this->assert($rectify !== null, ResponseCode::NOT_FOUND, '整改单不存在');

        $logs = QcRectifyLog::query()->where('rectify_id', $rectifyId)->orderBy('at')->get()
            ->map(fn (QcRectifyLog $l) => [
                'action' => $l->action,
                'actionLabel' => self::ACTION_LABELS[$l->action] ?? $l->action,
                'operator' => $l->operator,
                'remark' => $l->remark,
                'at' => $l->at?->toIso8601String(),
            ])->all();

        $orgNames = $this->orgNames([$rectify->owner_org]);
        $deptNames = $this->deptNames([$rectify->owner_dept]);

        return [
            'id' => $rectify->rectify_id,
            'title' => $rectify->title,
            'description' => $rectify->description,
            'source' => $rectify->source,
            'sourceLabel' => self::SOURCE_LABELS[$rectify->source] ?? $rectify->source,
            'level' => (int) $rectify->level,
            'levelLabel' => self::LEVEL_LABELS[$rectify->level] ?? (string) $rectify->level,
            'status' => $rectify->status,
            'statusLabel' => self::STATUS_LABELS[$rectify->status] ?? $rectify->status,
            'standardGap' => $rectify->standard_gap,
            'causeCategory' => $rectify->cause_category,
            'causeAnalysis' => $rectify->cause_analysis,
            'measure' => $rectify->measure,
            'ownerName' => $rectify->owner_name,
            'ownerOrg' => $rectify->owner_org,
            'ownerOrgName' => $orgNames[$rectify->owner_org] ?? $rectify->owner_org,
            'ownerDept' => $rectify->owner_dept,
            'ownerDeptName' => $deptNames[$rectify->owner_dept] ?? $rectify->owner_dept,
            'foundAt' => $rectify->found_at?->toIso8601String(),
            'deadline' => $rectify->deadline?->toIso8601String(),
            'closedAt' => $rectify->closed_at?->toIso8601String(),
            'reviewer' => $rectify->reviewer_name,
            'logs' => $logs,
        ];
    }

    /**
     * §5.6 整改销号（闭环流转：start/submit/approve/reject）
     */
    public function transition(string $rectifyId, array $data): array
    {
        $rectify = QcRectify::query()->where('rectify_id', $rectifyId)->first();
        $this->assert($rectify !== null, ResponseCode::NOT_FOUND, '整改单不存在');

        $action = $data['action'];
        [$fromStatuses, $toStatus] = self::TRANSITIONS[$action];

        if (! in_array($rectify->status, $fromStatuses, true)) {
            throw new BusinessException(ResponseCode::BAD_REQUEST, '非法流转：当前状态不允许执行该动作');
        }

        DB::transaction(function () use ($rectify, $rectifyId, $action, $toStatus, $data) {
            $rectify->update([
                'status' => $toStatus,
                'closed_at' => $action === 'approve' ? now() : $rectify->closed_at,
                'reviewer_name' => $action === 'approve' ? ($data['operator'] ?? $rectify->reviewer_name) : $rectify->reviewer_name,
            ]);

            QcRectifyLog::create([
                'rectify_id' => $rectifyId,
                'action' => $action,
                'operator' => $data['operator'] ?? '',
                'remark' => $data['remark'] ?? null,
                'at' => now(),
            ]);
        });

        $rectify->refresh();

        return [
            'id' => $rectify->rectify_id,
            'status' => $rectify->status,
            'statusLabel' => self::STATUS_LABELS[$rectify->status] ?? $rectify->status,
            'closedAt' => $rectify->closed_at?->toIso8601String(),
        ];
    }

    /**
     * §5.7 质控报表（整改台账聚合）
     */
    public function reports(array $filters): array
    {
        [$start, $end, $periodText] = $this->periodRange($filters['period'] ?? 'week');

        $base = QcRectify::query()->whereBetween('found_at', [$start, $end]);

        $total = (clone $base)->count();
        $open = (clone $base)->where('status', '!=', 'closed')->count();

        $bySource = (clone $base)->selectRaw('source, COUNT(*) as c')->groupBy('source')
            ->pluck('c', 'source')
            ->map(fn ($c, $s) => ['key' => $s, 'label' => self::SOURCE_LABELS[$s] ?? $s, 'value' => (int) $c])
            ->values()->all();

        $coverage = (clone $base)->where('owner_org', '!=', '')
            ->selectRaw('owner_org, owner_dept, COUNT(*) as total, SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) as closed')
            ->groupBy('owner_org', 'owner_dept')->orderByDesc('total')->get()
            ->map(function ($row) {
                $orgNames = $this->orgNames([$row->owner_org]);
                $deptNames = $this->deptNames([$row->owner_dept]);

                return [
                    'orgId' => $row->owner_org,
                    'orgName' => $orgNames[$row->owner_org] ?? $row->owner_org,
                    'deptId' => $row->owner_dept,
                    'deptName' => $deptNames[$row->owner_dept] ?? $row->owner_dept,
                    'alertCount' => (int) $row->total,
                    'alertPeople' => 0,
                    'toAssess' => 0,
                    'toIntervene' => 0,
                    'resolved' => (int) $row->closed,
                    'completionRate' => $row->total > 0 ? round($row->closed / $row->total, 4) : 0,
                ];
            })->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'periodText' => $periodText,
            'defs' => self::REPORT_DEFS,
            'metrics' => [
                ['key' => 'rectifyTotal', 'label' => '累计整改', 'value' => $total, 'unit' => '条'],
                ['key' => 'rectifyOpen', 'label' => '进行中', 'value' => $open, 'unit' => '条'],
                ['key' => 'pathwayRate', 'label' => '绿色通道达标率', 'value' => 0, 'unit' => '%'],
                ['key' => 'respMedian', 'label' => '到院反应中位数', 'value' => 0, 'unit' => '分钟'],
            ],
            'bySource' => $bySource,
            'trend' => $this->weeklyTrend($start, $end),
            'coverage' => $coverage,
        ];
    }

    /**
     * 台账列表查询构造（ledger 与 export 复用过滤条件）
     */
    public function filteredQuery(array $filters)
    {
        return $this->filterQuery($filters);
    }

    private function filterQuery(array $filters)
    {
        return QcRectify::query()
            ->when(! empty($filters['source']), fn ($q, $v) => $q->where('source', $v))
            ->when(! empty($filters['level']), fn ($q, $v) => $q->where('level', $v))
            ->when(! empty($filters['status']), fn ($q, $v) => $q->where('status', $v))
            ->when(! empty($filters['roleView']), fn ($q, $v) => $q->where('role_view', $v))
            ->when(! empty($filters['keyword']), function ($q, $v) {
                $q->where(fn ($sub) => $sub->where('rectify_id', 'like', "%{$v}%")
                    ->orWhere('title', 'like', "%{$v}%")
                    ->orWhere('owner_name', 'like', "%{$v}%"));
            });
    }

    private function isOverdue(QcRectify $r): bool
    {
        return $r->status !== 'closed' && $r->deadline !== null && $r->deadline->lt(now());
    }

    /**
     * 批量解析机构名称（best-effort：org_code 匹配，缺失回退原值）
     */
    private function orgNames(array $ids): array
    {
        $ids = array_values(array_filter(array_unique($ids)));

        if ($ids === []) {
            return [];
        }

        return Organization::query()->whereIn('org_code', $ids)->pluck('org_name', 'org_code')->all();
    }

    /**
     * 批量解析科室名称（best-effort：dept_code 匹配，缺失回退原值）
     */
    private function deptNames(array $ids): array
    {
        $ids = array_values(array_filter(array_unique($ids)));

        if ($ids === []) {
            return [];
        }

        return Department::query()->whereIn('dept_code', $ids)->pluck('dept_name', 'dept_code')->all();
    }

    private function periodRange(string $period): array
    {
        $now = now();

        return match ($period) {
            'day' => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), $now->toDateString()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), $now->format('Y-m')],
            default => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), $now->copy()->startOfWeek()->toDateString().' ~ '.$now->copy()->endOfWeek()->toDateString()],
        };
    }

    /**
     * 近 8 周发现/销号趋势（DB 无关，取数后 PHP 分组）
     */
    private function weeklyTrend(Carbon $start, Carbon $end): array
    {
        $rows = QcRectify::query()
            ->whereBetween('found_at', [$start, $end])
            ->get(['found_at', 'closed_at', 'status']);

        $trend = [];
        $anchor = $end->copy()->startOfWeek();

        for ($i = 7; $i >= 0; $i--) {
            $ws = $anchor->copy()->subWeeks($i);
            $we = $ws->copy()->endOfWeek();

            $found = $rows->filter(fn (QcRectify $r) => $r->found_at !== null && $r->found_at->between($ws, $we))->count();
            $closed = $rows->filter(fn (QcRectify $r) => $r->status === 'closed' && $r->closed_at !== null && $r->closed_at->between($ws, $we))->count();

            $trend[] = ['label' => 'W-'.$i, 'found' => $found, 'closed' => $closed];
        }

        return $trend;
    }
}
