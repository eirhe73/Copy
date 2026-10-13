<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_records', function (Blueprint $table) {
            $table->id();
            $table->string('sla_code', 50)->unique()->comment('时限记录编号');
            $table->string('kind', 50)->comment('时限类型：预警到床/出警到院等');
            $table->string('rule_id', 50)->index()->comment('规则标识，如 SLA-ALERT');
            $table->string('subject', 200)->comment('对象描述，如 患者·床位 / 车辆·任务号');
            $table->string('owner', 100)->nullable()->comment('责任人');
            $table->string('role_view', 30)->default('doctor')->index()->comment('视角：doctor/director');
            $table->dateTime('started_at')->comment('计时开始');
            $table->dateTime('arrived_at')->nullable()->comment('计时结束（到达）');
            $table->unsignedInteger('limit_minutes')->comment('时限分钟数');
            $table->integer('used_minutes')->nullable()->comment('已用分钟数');
            $table->boolean('overtime')->default(false)->index()->comment('是否超时');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_records');
    }
};
