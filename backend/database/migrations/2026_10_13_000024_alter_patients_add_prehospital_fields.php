<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->json('prehospital')->nullable()->comment('院前上报明细');
            $table->unsignedTinyInteger('is_draft')->default(0)->comment('是否草稿：1草稿0已提交');
            $table->string('entry', 16)->default('field')->comment('接诊入口：field现场/inpatient院内');
            $table->string('stage', 32)->default('registered')->comment('患者阶段');
            $table->string('source_record_id', 64)->nullable()->comment('来源业务记录编号');
            $table->string('institution_id', 32)->nullable()->comment('上报机构编号');
            $table->string('department_id', 32)->nullable()->comment('上报科室编号');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['prehospital', 'is_draft', 'entry', 'stage', 'source_record_id', 'institution_id', 'department_id']);
        });
    }
};
