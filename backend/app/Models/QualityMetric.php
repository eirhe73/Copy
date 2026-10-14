<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 质量指标（quality_metrics）
 */
class QualityMetric extends Model
{
    protected $fillable = [
        'metric_id', 'name', 'category', 'unit', 'target', 'direction', 'owner',
    ];

    protected $casts = [
        'target' => 'decimal:4',
    ];

    public function trends(): HasMany
    {
        return $this->hasMany(QualityMetricTrend::class, 'metric_id', 'metric_id');
    }
}
