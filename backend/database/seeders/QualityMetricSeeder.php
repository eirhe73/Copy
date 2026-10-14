<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 质量指标（quality_metrics）+ 指标趋势（quality_metric_trends）
 */
class QualityMetricSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('quality_metrics')->insert([
            ['metric_id' => 'QM-RESP-MEDIAN', 'name' => '到院反应时长中位数', 'category' => '时效', 'unit' => '分钟', 'target' => 30, 'direction' => 'lower', 'owner' => '王建国', 'created_at' => $now, 'updated_at' => $now],
            ['metric_id' => 'QM-PATHWAY-RATE', 'name' => '绿色通道达标率', 'category' => '时效', 'unit' => '%', 'target' => 0.95, 'direction' => 'higher', 'owner' => '刘敏', 'created_at' => $now, 'updated_at' => $now],
            ['metric_id' => 'QM-CONSULT-VOLUME', 'name' => '远程会诊量', 'category' => '协同', 'unit' => '例', 'target' => null, 'direction' => 'higher', 'owner' => '赵强', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('quality_metric_trends')->insert([
            ['metric_id' => 'QM-RESP-MEDIAN', 'period' => 'week', 'point_date' => '2026-09-22', 'value' => 31, 'baseline_value' => 33, 'delta' => -2, 'generated_at' => $now, 'created_at' => $now, 'updated_at' => $now],
            ['metric_id' => 'QM-RESP-MEDIAN', 'period' => 'week', 'point_date' => '2026-09-29', 'value' => 30, 'baseline_value' => 32, 'delta' => -2, 'generated_at' => $now, 'created_at' => $now, 'updated_at' => $now],
            ['metric_id' => 'QM-RESP-MEDIAN', 'period' => 'week', 'point_date' => '2026-10-06', 'value' => 28, 'baseline_value' => 31, 'delta' => -3, 'generated_at' => $now, 'created_at' => $now, 'updated_at' => $now],
            ['metric_id' => 'QM-PATHWAY-RATE', 'period' => 'week', 'point_date' => '2026-10-06', 'value' => 0.92, 'baseline_value' => 0.90, 'delta' => 0.02, 'generated_at' => $now, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
