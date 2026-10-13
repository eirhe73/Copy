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
            $table->string('opinion_no', 32)->unique()->comment('意见编号，如 OPI-1001');
            $table->string('session_id', 64)->index()->comment('会诊会话编号');
            $table->text('content');
            $table->string('doctor_id', 64)->default('')->comment('提交医生账号');
            $table->string('doctor_name', 64)->default('');
            $table->string('feedback', 32)->default('')->comment('执行反馈');
            $table->dateTime('submitted_at')->comment('提交时间');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_opinions');
    }
};
