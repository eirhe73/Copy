<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->unique()->comment('会诊会话编号');
            $table->string('token', 64)->nullable()->unique()->comment('会诊室 token（UUID）');
            $table->string('consult_code', 16)->default('')->comment('会诊码');
            $table->string('mode', 16)->default('standalone')->comment('运行模式');
            $table->boolean('compatible120')->default(false)->comment('是否兼容120任务');
            $table->string('patient_id', 32)->nullable()->comment('已登记患者编号');
            $table->string('patient_name', 64)->default('')->comment('患者姓名');
            $table->unsignedTinyInteger('patient_gender')->default(0)->comment('性别：0男1女');
            $table->unsignedInteger('patient_age')->default(0)->comment('年龄');
            $table->string('chief_complaint', 255)->default('')->comment('主诉');
            $table->string('task120_id', 32)->nullable()->comment('120 任务号');
            $table->string('source_hospital', 64)->default('')->comment('发起医院');
            $table->string('source_department', 64)->default('')->comment('发起科室');
            $table->string('hospital', 64)->default('')->comment('接诊医院');
            $table->string('department', 64)->default('')->comment('接诊科室');
            $table->string('nominated_doctor_id', 64)->nullable()->comment('意向接诊医生');
            $table->string('accepted_by', 64)->nullable()->comment('接诊医生账号');
            $table->string('accepted_by_name', 64)->nullable()->comment('接诊医生姓名');
            $table->dateTime('accepted_at')->nullable();
            $table->dateTime('opened_at')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->string('note', 255)->default('')->comment('备注');
            $table->unsignedTinyInteger('status')->default(0)->index()->comment('状态：0待接诊1会诊中2已结束');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_sessions');
    }
};
