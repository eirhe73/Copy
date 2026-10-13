<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_opinions', function (Blueprint $table) {
            $table->id();
            $table->string('room_token', 64)->index('idx_opinion_room')->comment('会诊室 token');
            $table->string('session_id', 64)->default('')->index('idx_opinion_session')->comment('会诊会话编号');
            $table->string('doctor_id', 64)->default('')->comment('提交意见医生账号');
            $table->string('doctor_name', 64)->default('')->comment('提交意见医生姓名');
            $table->text('content')->comment('会诊意见正文');
            $table->json('feedback')->nullable()->comment('执行反馈 [{by,at,value}]');
            $table->dateTime('submitted_at')->useCurrent()->comment('提交时间');
            $table->dateTime('created_at')->useCurrent()->comment('创建时间');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_opinions');
    }
};
