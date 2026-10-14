<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 患者临床时间轴事件表（03-患者与床位/02-患者管理接口 §2.2）
        Schema::create('patient_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 48)->unique()->comment('事件唯一编号');
            $table->string('patient_id', 32)->comment('患者编号');
            $table->string('patient_name', 64)->default('')->comment('患者姓名（冗余）');
            $table->string('type', 16)->default('registered')->comment('事件类型');
            $table->dateTime('at')->comment('事件发生时间');
            $table->string('actor_id', 32)->nullable()->comment('操作人编号');
            $table->string('note', 255)->default('')->comment('事件描述');
            $table->json('scopes')->nullable()->comment('作用范围');
            $table->json('user_ids')->nullable()->comment('相关医护编号数组');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['patient_id', 'at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_events');
    }
};
