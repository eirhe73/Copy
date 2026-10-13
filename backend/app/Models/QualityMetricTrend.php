<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 质量指标趋势点（quality_metric_trends）
 */
class QualityMetricTrend extends Model
{
    protected $fillable = [
        'metric_id', 'period', 'point_date', 'value', 'baseline_value', 'delta', 'generated_at',
    ];

    protected $casts = [
        'point_date' => 'date',
        'value' => 'decimal:4',
        'baseline_value' => 'decimal:4',
        'delta' => 'decimal:4',
        'generated_at' => 'datetime',
    ];

    public function metric(): BelongsTo
    {
        return $this->belongsTo(QualityMetric::class, 'metric_id', 'metric_id');
    }
}
