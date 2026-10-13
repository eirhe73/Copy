<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique('uk_room_token')->comment('会诊室标识（UUID，作入会链接与主键标识）');
            $table->char('consult_code', 6)->default('')->comment('会诊码（token 前 6 位展示）');
            $table->string('session_id', 64)->index('idx_room_session')->comment('会诊会话编号，关联 consult_sessions.session_id');
            $table->string('patient_id', 64)->default('')->index('idx_room_patient')->comment('患者编号');
            $table->string('room_name', 128)->default('')->comment('会诊室名称');
            $table->string('media_mode', 16)->default('PLACEHOLDER')->comment('音视频模式：RTC正式/PLACEHOLDER占位');
            $table->string('rtc_url', 255)->nullable()->comment('音视频服务地址（生产接第三方 RTC）');
            $table->unsignedTinyInteger('status')->default(0)->index('idx_room_status')->comment('状态：0待接诊1会诊中2已结束');
            $table->dateTime('opened_at')->nullable()->comment('会诊开始时间（接诊后）');
            $table->dateTime('closed_at')->nullable()->comment('会诊结束时间（提交意见后）');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_rooms');
    }
};
