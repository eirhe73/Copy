<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 协同待办（现场工作台 · 移动会诊待办）
        Schema::create('coordination_todos', function (Blueprint $table) {
            $table->id();
            $table->string('todo_id', 64)->unique()->comment('待办编号');
            $table->string('assignee_id', 64)->default('')->comment('待办责任人 staff.id');
            $table->string('title', 128)->default('')->comment('待办标题');
            $table->string('hint', 255)->default('')->comment('待办提示');
            $table->string('tone', 16)->default('warn')->comment('紧急度：danger/warn/default');
            $table->string('kind', 32)->default('')->comment('类型：consult_dispatch/transfer_confirm/identity/feedback');
            $table->string('patient_id', 64)->nullable()->comment('关联患者编号');
            $table->string('patient_name', 64)->default('')->comment('关联患者姓名');
            $table->string('journey_id', 64)->nullable()->comment('关联旅程编号');
            $table->string('token', 128)->nullable()->comment('会诊/接收令牌');
            $table->string('source_institution_id', 32)->default('')->comment('来源机构编码');
            $table->string('source_department_id', 32)->default('')->comment('来源科室编码');
            $table->string('target_institution_id', 32)->default('')->comment('目标机构编码');
            $table->string('target_department_id', 32)->default('')->comment('目标科室编码');
            $table->string('priority', 8)->default('P0')->comment('优先级：P0/P1');
            $table->string('status', 16)->default('open')->comment('状态：open/accepted/done');
            $table->dateTime('at')->comment('待办生成时间');
            $table->dateTime('due_at')->nullable()->comment('截止时间');
            $table->timestamps();

            $table->index(['assignee_id', 'status']);
            $table->index('patient_id');
            $table->index('token');
        });

        // 协同任务（现场工作台 · 任务协同）
        Schema::create('coordination_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_id', 64)->unique()->comment('任务编号');
            $table->string('title', 128)->default('')->comment('任务标题');
            $table->string('kind', 16)->default('')->comment('类型：transport/consult/handover/assessment');
            $table->string('patient_id', 64)->default('')->comment('关联患者编号');
            $table->string('patient_name', 64)->default('')->comment('关联患者姓名');
            $table->string('source_institution_id', 32)->default('')->comment('来源机构编码');
            $table->string('source_department_id', 32)->default('')->comment('来源科室编码');
            $table->string('target_institution_id', 32)->default('')->comment('目标机构编码');
            $table->string('target_department_id', 32)->default('')->comment('目标科室编码');
            $table->string('assignee_id', 64)->default('')->comment('责任人 staff.id');
            $table->string('assignee_name', 64)->default('')->comment('责任人姓名');
            $table->string('vehicle_id', 32)->default('')->comment('关联车辆编号');
            $table->string('status', 16)->default('todo')->comment('状态：todo/doing/done');
            $table->json('milestones')->nullable()->comment('进度关键点');
            $table->dateTime('started_at')->nullable()->comment('计划开始时间');
            $table->dateTime('due_at')->nullable()->comment('计划截止时间');
            $table->timestamps();

            $table->index(['assignee_id', 'status']);
            $table->index('patient_id');
            $table->index('vehicle_id');
        });

        // 手机重症接收单
        Schema::create('mobile_receptions', function (Blueprint $table) {
            $table->id();
            $table->string('reception_id', 64)->unique()->comment('接收单号');
            $table->string('token', 128)->unique()->comment('接收/入会令牌（URL token）');
            $table->string('journey_id', 64)->nullable()->comment('关联旅程编号');
            $table->string('patient_id', 64)->default('')->comment('关联患者编号');
            $table->string('patient_name', 64)->default('')->comment('关联患者姓名');
            $table->string('gender', 8)->default('')->comment('性别');
            $table->unsignedInteger('age')->nullable()->comment('年龄');
            $table->string('phone', 24)->default('')->comment('联系电话');
            $table->string('source_institution_id', 32)->default('')->comment('来源机构编码');
            $table->string('source_department_id', 32)->default('')->comment('来源科室编码');
            $table->string('category', 16)->default('')->comment('病情类别');
            $table->string('complaint', 255)->default('')->comment('主诉');
            $table->json('symptoms')->nullable()->comment('症状数组');
            $table->string('accepted_institution_id', 32)->nullable()->comment('接收机构编码');
            $table->string('accepted_department_id', 32)->nullable()->comment('接收科室编码');
            $table->string('accepted_by', 64)->default('')->comment('确认接收人 staff.id');
            $table->string('status', 16)->default('pending')->comment('状态：pending/accepted/rejected/timeout');
            $table->json('prep_checklist')->nullable()->comment('到院准备');
            $table->dateTime('accepted_at')->nullable()->comment('确认接收时间');
            $table->timestamps();

            $table->index('patient_id');
            $table->index('status');
            $table->index(['accepted_institution_id', 'accepted_department_id'], 'idx_accepted_target');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_receptions');
        Schema::dropIfExists('coordination_tasks');
        Schema::dropIfExists('coordination_todos');
    }
};
