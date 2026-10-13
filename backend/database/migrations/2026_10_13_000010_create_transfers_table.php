<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 按原系统表结构还原（vehicle_archive_id 改为 vehicle_id，对应本项目 vehicles 表）
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_code', 50)->unique()->comment('转诊单号');
            $table->unsignedBigInteger('event_id')->nullable()->index()->comment('关联急救事件');
            $table->unsignedBigInteger('patient_id')->nullable()->index()->comment('关联患者');
            $table->unsignedBigInteger('from_org_id')->index()->comment('转出机构');
            $table->unsignedBigInteger('to_org_id')->nullable()->index()->comment('转入机构');
            $table->string('urgency_level', 20)->default('URGENCY_MEDIUM')->index()->comment('紧急程度');
            $table->text('transfer_reason')->comment('转诊原因');
            $table->string('diagnosis', 200)->nullable()->comment('诊断');
            $table->string('trigger_source', 50)->nullable()->comment('触发来源');
            $table->string('transfer_status', 30)->default('TRANSFER_PENDING')->index()->comment('转诊状态');
            $table->string('confirm_status', 30)->default('CONFIRM_PENDING')->comment('确认状态');
            $table->dateTime('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by_user_id')->nullable();
            $table->text('reject_reason')->nullable()->comment('拒绝原因');
            $table->string('review_note', 500)->nullable()->comment('审核备注');
            $table->unsignedBigInteger('vehicle_id')->nullable()->index()->comment('转运车辆');
            $table->string('driver_name', 100)->nullable();
            $table->dateTime('eta')->nullable()->comment('预计到达时间');
            $table->json('latest_vitals')->nullable()->comment('最新生命体征');
            $table->json('resource_prep')->nullable()->comment('资源准备');
            $table->string('handover_status', 30)->nullable()->comment('交接状态');
            $table->unsignedBigInteger('initiator_user_id')->comment('发起人');
            $table->string('from_institution_id', 32)->nullable()->comment('转出机构编号');
            $table->string('to_institution_id', 32)->nullable()->comment('转入机构编号');
            $table->string('doctor_id', 64)->nullable()->comment('随车医生账号');
            $table->string('nurse_id', 64)->nullable()->comment('随车护士账号');
            $table->dateTime('started_at')->nullable()->comment('开始转运时间');
            $table->dateTime('arrived_at')->nullable()->comment('到达时间');
            $table->dateTime('handover_at')->nullable()->comment('交接时间');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
