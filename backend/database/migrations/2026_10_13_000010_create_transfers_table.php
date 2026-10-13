<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 转运任务表（03-患者与床位/03-转诊协同接口 §2.1 附录建表语句）
        // 说明：event_id / doctor_id / nurse_id / is_deleted / deleted_at 为「10-急救调度与监控专项」及项目基础设施所需（文档外扩展字段）
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_id', 32)->unique()->comment('转诊编号，如 TRF-20261013-001');
            $table->string('patient_id', 32)->default('')->comment('患者编号');
            $table->string('patient_name', 64)->default('')->comment('患者姓名（冗余）');
            $table->unsignedTinyInteger('direction')->default(0)->comment('方向：0上转 1下转');
            $table->string('source_institution_id', 32)->default('')->comment('来源机构编号');
            $table->string('source_department_id', 32)->default('')->comment('来源科室编号');
            $table->string('target_institution_id', 32)->default('')->comment('目标机构编号');
            $table->string('target_department_id', 32)->default('')->comment('目标科室编号');
            $table->unsignedTinyInteger('status')->default(0)->comment('状态：0待接收1已接收2转运中3到院4已完成5已拒绝');
            $table->boolean('green_channel')->default(false)->comment('是否绿色通道：1是 0否');
            $table->string('channel_type', 32)->default('')->comment('华西绿色通道类型');
            $table->string('reason', 255)->default('')->comment('转诊原因/诊断');
            $table->string('transport_vehicle_id', 32)->nullable()->comment('转运车辆编号');
            $table->string('created_by', 32)->default('')->comment('发起人编号');
            $table->dateTime('started_at')->comment('发起转诊时间');
            $table->dateTime('accepted_at')->nullable()->comment('接收确认时间');
            $table->dateTime('arrived_at')->nullable()->comment('到达接收方时间');
            $table->dateTime('completed_at')->nullable()->comment('转诊完成时间');
            $table->unsignedBigInteger('event_id')->nullable()->index()->comment('关联急救事件（10-急救调度）');
            $table->string('doctor_id', 64)->nullable()->comment('随车医生账号（10-急救调度）');
            $table->string('nurse_id', 64)->nullable()->comment('随车护士账号（10-急救调度）');
            $table->boolean('is_deleted')->default(false)->comment('软删除标记（BaseModel 同步）');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index(['status', 'started_at']);
            $table->index('target_institution_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
