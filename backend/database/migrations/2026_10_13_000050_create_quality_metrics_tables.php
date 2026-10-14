<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quality_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('metric_id', 32)->unique()->comment('指标编号，如 QM-RESP-MEDIAN');
            $table->string('name', 64)->default('')->comment('指标名，如 到院反应时长中位数');
            $table->string('category', 16)->default('')->comment('分类：时效/量级/协同');
            $table->string('unit', 16)->default('')->comment('单位：分钟/%/例');
            $table->decimal('target', 12, 4)->nullable()->comment('目标值');
            $table->string('direction', 8)->default('lower')->comment('阈值方向：lower越小越好 higher越大越好');
            $table->string('owner', 64)->default('')->comment('指标负责人');
            $table->timestamps();
        });

        Schema::create('quality_metric_trends', function (Blueprint $table) {
            $table->id();
            $table->string('metric_id', 32)->comment('指标编号');
            $table->string('period', 16)->default('week')->comment('周期：day/week/month');
            $table->date('point_date')->comment('统计点日期');
            $table->decimal('value', 12, 4)->default(0)->comment('指标值');
            $table->decimal('baseline_value', 12, 4)->nullable()->comment('对比基准值（环比/同比）');
            $table->decimal('delta', 12, 4)->nullable()->comment('较基准变化量');
            $table->dateTime('generated_at')->nullable()->comment('生成时间');
            $table->timestamps();

            $table->unique(['metric_id', 'period', 'point_date'], 'uk_metric_point');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quality_metric_trends');
        Schema::dropIfExists('quality_metrics');
    }
};
