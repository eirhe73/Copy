<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 机构成员表（公开医护资料 / 本科室人员）
        Schema::create('organization_members', function (Blueprint $table) {
            $table->id();
            $table->string('member_id', 64)->unique()->comment('成员编码，如 weiyuan-lai-jun');
            $table->string('org_code', 50)->comment('所属机构编码');
            $table->string('name', 64)->default('')->comment('姓名');
            $table->string('title', 64)->default('')->comment('职称，如 主任医师');
            $table->string('profession', 16)->default('')->comment('职业：医师/护理');
            $table->string('dept_id', 32)->default('')->comment('所属科室编码');
            $table->json('work_areas')->nullable()->comment('工作区数组：reception/ward/field');
            $table->string('evidence_as_of', 16)->default('')->comment('人员资料截至');
            $table->timestamps();

            $table->index(['org_code', 'dept_id']);
            $table->index('profession');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_members');
    }
};
