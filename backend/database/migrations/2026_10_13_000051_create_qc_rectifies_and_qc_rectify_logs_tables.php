<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 质控整改单（含差距分析/原因分析/整改措施，四态流转）
        Schema::create('qc_rectifies', function (Blueprint $table) {
            $table->id();
            $table->string('rectify_id', 32)->unique()->comment('整改编号，如 ZG02600001');
            $table->string('title', 128)->default('')->comment('问题标题');
            $table->text('description')->nullable()->comment('问题描述');
            $table->string('source', 32)->default('manual')->comment('问题来源：alert/pathwayTimeout/inspection/complaint/manual');
            $table->unsignedTinyInteger('level')->default(2)->comment('级别：1严重 2一般 3轻微');
            $table->string('status', 16)->default('pending')->comment('状态：pending/rectifying/reviewing/closed');
            $table->string('owner_name', 64)->default('')->comment('责任人姓名');
            $table->string('owner_org', 32)->default('')->comment('所属机构ID');
            $table->string('owner_dept', 32)->default('')->comment('科室ID');
            $table->string('standard_id', 32)->nullable()->comment('关联质控标准编号');
            $table->string('rule_id', 32)->nullable()->comment('关联时限规则编号');
            $table->dateTime('found_at')->comment('发现时间');
            $table->dateTime('deadline')->comment('整改期限');
            $table->dateTime('closed_at')->nullable()->comment('销号时间');
            $table->string('standard_gap', 255)->default('')->comment('差距分析');
            $table->string('cause_category', 32)->default('')->comment('原因分类');
            $table->text('cause_analysis')->nullable()->comment('原因分析');
            $table->text('measure')->nullable()->comment('整改措施');
            $table->string('reviewer_name', 64)->default('')->comment('复评人');
            $table->string('role_view', 16)->default('doctor')->comment('数据权限角色：doctor/director');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index(['level', 'status']);
            $table->index('role_view');
            $table->index(['owner_org', 'owner_dept']);
            $table->index(['status', 'deadline']);
            $table->index('found_at');
        });

        // 整改流转日志（销号流程动作流水）
        Schema::create('qc_rectify_logs', function (Blueprint $table) {
            $table->id();
            $table->string('rectify_id', 32)->comment('整改编号');
            $table->string('action', 16)->default('')->comment('动作：start/submit/approve/reject');
            $table->string('operator', 64)->default('')->comment('操作人');
            $table->text('remark')->nullable()->comment('流转说明');
            $table->dateTime('at')->comment('动作时间');
            $table->timestamps();

            $table->index(['rectify_id', 'at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_rectify_logs');
        Schema::dropIfExists('qc_rectifies');
    }
};
