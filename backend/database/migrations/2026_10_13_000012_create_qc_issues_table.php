<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 按原系统表结构还原
        Schema::create('qc_issues', function (Blueprint $table) {
            $table->id();
            $table->string('qc_code', 50)->unique()->comment('质控编号');
            $table->string('issue_title', 200)->comment('问题标题');
            $table->string('severity', 20)->default('SEVERITY_MEDIUM')->index()->comment('严重程度');
            $table->string('issue_source', 50)->nullable()->comment('问题来源');
            $table->unsignedBigInteger('owner_user_id')->nullable()->index()->comment('责任人');
            $table->string('current_stage', 50)->nullable()->comment('当前环节');
            $table->string('qc_status', 30)->default('QC_OPEN')->index()->comment('质控状态');
            $table->unsignedInteger('state_version')->default(1)->comment('状态版本（乐观锁）');
            $table->dateTime('due_at')->nullable()->comment('整改期限');
            $table->string('related_type', 50)->nullable()->comment('关联对象类型');
            $table->unsignedBigInteger('related_id')->nullable()->comment('关联对象ID');
            $table->string('supervise_target', 200)->nullable()->comment('督查对象');
            $table->string('check_method', 50)->nullable()->comment('检查方式');
            $table->string('check_item', 200)->nullable()->comment('检查项');
            $table->string('check_result', 200)->nullable()->comment('检查结果');
            $table->date('discovered_at')->nullable()->comment('发现日期');
            $table->boolean('is_on_time_completed')->nullable()->comment('是否按期完成');
            $table->unsignedBigInteger('event_id')->nullable()->index()->comment('关联急救事件');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_issues');
    }
};
