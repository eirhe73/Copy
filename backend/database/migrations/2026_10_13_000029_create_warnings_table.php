<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warnings', function (Blueprint $table) {
            $table->id();
            $table->string('warning_no', 32)->unique()->comment('预警编号，如 WARN-20261012-001');
            $table->string('patient_id', 32)->index()->comment('患者ID');
            $table->string('patient_label', 64)->default('')->comment('患者标签，如 心内科 12床');
            $table->string('category', 32)->default('')->comment('类别：NEWS/CRITICAL_VALUE/VASOACTIVE/COAG');
            $table->string('title', 128)->default('');
            $table->string('metric', 32)->default('')->comment('关联指标');
            $table->decimal('current_value', 10, 2)->nullable();
            $table->string('threshold', 64)->default('');
            $table->string('level', 16)->default('warning')->comment('等级：urgent紧急/warning关注');
            $table->string('status', 16)->default('new')->index()->comment('状态：new/acknowledged/treating/resolved');
            $table->string('institution_id', 32)->nullable();
            $table->string('department_id', 32)->nullable();
            $table->dateTime('occurred_at')->comment('预警触发时间');
            $table->timestamps();

            $table->index(['category', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warnings');
    }
};
