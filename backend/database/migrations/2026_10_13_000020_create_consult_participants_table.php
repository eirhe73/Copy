<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_participants', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->index()->comment('会诊会话编号');
            $table->string('role', 32)->default('')->comment('角色');
            $table->string('name', 64)->default('')->comment('成员姓名');
            $table->boolean('online')->default(false)->comment('在线：0离线1在线');
            $table->string('device_type', 16)->nullable()->comment('终端类型');
            $table->string('join_mode', 16)->nullable()->comment('入会方式：link/code');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_participants');
    }
};
