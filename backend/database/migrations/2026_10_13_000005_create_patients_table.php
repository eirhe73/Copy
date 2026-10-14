<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 患者档案表（03-患者与床位/02-患者管理接口 §2.1 附录建表语句）
        // 说明：is_draft 为 §3.1 急救医生快速登记所需；is_deleted 为项目 BaseModel 软删除同步所需（文档外的基础设施字段）
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id', 32)->unique()->comment('患者唯一业务编号，如 FIELD-001');
            $table->string('name', 64)->default('')->comment('患者姓名');
            $table->unsignedTinyInteger('gender')->default(0)->comment('性别：0男1女2未知');
            $table->unsignedInteger('age')->nullable()->comment('年龄');
            $table->string('id_card', 18)->default('')->comment('证件号（脱敏存储）');
            $table->string('phone', 20)->default('')->comment('联系电话（脱敏）');
            $table->string('institution_id', 32)->default('')->comment('所属机构编号');
            $table->string('department_id', 32)->default('')->comment('所属科室编号');
            $table->json('assigned_to')->nullable()->comment('责任医护编号数组');
            $table->string('stage', 32)->default('registered')->comment('阶段：见阶段枚举');
            $table->string('chief_complaint', 255)->default('')->comment('归一化主诉');
            $table->json('symptoms')->nullable()->comment('症状数组');
            $table->text('notes')->nullable()->comment('备注');
            $table->string('source', 16)->default('manual')->comment('来源：manual/120');
            $table->string('source_record_id', 48)->nullable()->comment('来源记录号');
            $table->json('prehospital')->nullable()->comment('院前上报明细');
            $table->string('consultation_token', 64)->nullable()->comment('关联会诊编号');
            $table->string('consultation_doctor_id', 32)->nullable()->comment('接诊医生编号');
            $table->string('consultation_request_id', 48)->nullable()->comment('会诊申请编号');
            $table->dateTime('admitted_at')->nullable()->comment('入科时间');
            $table->unsignedTinyInteger('is_draft')->default(0)->comment('是否草稿：1草稿0已提交（§3.1）');
            $table->boolean('is_deleted')->default(false)->comment('软删除标记（BaseModel 同步）');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->unique('source_record_id');
            $table->index('stage');
            $table->index(['institution_id', 'department_id']);
            $table->index(['name', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
