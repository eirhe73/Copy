<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinical_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_code', 50)->unique()->comment('诊疗记录编号');
            $table->unsignedBigInteger('patient_id')->index()->comment('患者');
            $table->unsignedBigInteger('doctor_user_id')->index()->comment('接诊医生');
            $table->unsignedBigInteger('org_id')->nullable()->index()->comment('接诊机构');
            $table->string('record_type', 50)->default('OUTPATIENT')->comment('记录类型：门诊/急诊/随访');
            $table->text('chief_complaint')->nullable()->comment('主诉');
            $table->text('present_history')->nullable()->comment('现病史');
            $table->string('diagnosis', 500)->nullable()->comment('诊断');
            $table->text('treatment')->nullable()->comment('处置意见');
            $table->dateTime('visit_at')->index()->comment('就诊时间');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinical_records');
    }
};
