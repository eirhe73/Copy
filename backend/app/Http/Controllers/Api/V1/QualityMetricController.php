<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\QualityMetric;
use App\Models\QualityMetricTrend;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QualityMetricController extends Controller
{
    private const DIRECTION_LABELS = ['lower' => '越小越好', 'higher' => '越大越好'];

    /**
     * 质量指标看板（最新指标值取自各指标最近一条趋势点）
     */
    public function index(Request $request): JsonResponse
    {
        $metrics = QualityMetric::query()
            ->when($request->input('category'), fn ($q, $v) => $q->where('category', $v))
            ->orderBy('metric_id')
            ->get();

        // 各指标最近一条趋势点（倒序取第一条）
        $latest = QualityMetricTrend::query()
            ->whereIn('metric_id', $metrics->pluck('metric_id')->all())
            ->orderByDesc('point_date')
            ->get()
            ->unique('metric_id')
            ->keyBy('metric_id');

        $list = $metrics->map(function (QualityMetric $m) use ($latest) {
            $trend = $latest->get($m->metric_id);
            $value = $trend?->value !== null ? (float) $trend->value : null;
            $achieved = null;

            if ($value !== null && $m->target !== null) {
                $achieved = $m->direction === 'higher'
                    ? $value >= (float) $m->target
                    : $value <= (float) $m->target;
            }

            return [
                'metricId' => $m->metric_id,
                'name' => $m->name,
                'category' => $m->category,
                'unit' => $m->unit,
                'value' => $value,
                'target' => $m->target === null ? null : (float) $m->target,
                'direction' => $m->direction,
                'directionLabel' => self::DIRECTION_LABELS[$m->direction] ?? $m->direction,
                'achieved' => $achieved,
                'owner' => $m->owner,
            ];
        })->all();

        return response()->json([
            'updatedAt' => now()->toIso8601String(),
            'metrics' => $list,
        ]);
    }

    /**
     * 指标趋势（同比/环比对比点序列）
     */
    public function trend(Request $request): JsonResponse
    {
        $metricId = $request->input('metricId');
        if (! $metricId) {
            return response()->json(['message' => '缺少指标编号 metricId'], 400);
        }

        $metric = QualityMetric::query()->where('metric_id', $metricId)->first();
        if (! $metric) {
            return response()->json(['message' => '指标不存在'], 404);
        }

        $period = $request->input('period', 'week');

        $points = QualityMetricTrend::query()
            ->where('metric_id', $metricId)
            ->where('period', $period)
            ->orderBy('point_date')
            ->get()
            ->map(fn (QualityMetricTrend $t) => [
                'pointDate' => $t->point_date?->toDateString(),
                'value' => $t->value === null ? null : (float) $t->value,
                'baselineValue' => $t->baseline_value === null ? null : (float) $t->baseline_value,
                'delta' => $t->delta === null ? null : (float) $t->delta,
            ])
            ->all();

        return response()->json([
            'metricId' => $metric->metric_id,
            'metricName' => $metric->name,
            'unit' => $metric->unit,
            'period' => $period,
            'points' => $points,
        ]);
    }
}
