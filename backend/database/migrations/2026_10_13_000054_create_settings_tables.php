<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 通知渠道配置（系统设置 · 通知渠道）
        Schema::create('notification_channels', function (Blueprint $table) {
            $table->id();
            $table->string('channel_id', 32)->unique()->comment('渠道编号，如 ch-wechat');
            $table->string('channel', 16)->unique()->comment('渠道代码：wechat/sms/inapp');
            $table->string('name', 64)->default('')->comment('渠道显示名');
            $table->boolean('enabled')->default(false)->comment('是否启用：0关1开');
            $table->json('config')->nullable()->comment('渠道参数：模板/签名/回调等');
            $table->unsignedInteger('sort')->default(0)->comment('显示排序');
            $table->timestamps();
        });

        // 系统偏好配置（系统设置 · 偏好配置）
        Schema::create('system_preferences', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 64)->default('')->comment('归属用户账号（空=全局默认）');
            $table->string('pref_key', 64)->comment('偏好键：theme/locale/notification/list_density');
            $table->json('pref_value')->nullable()->comment('偏好值（结构化）');
            $table->timestamps();

            $table->unique(['user_id', 'pref_key'], 'uk_user_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_preferences');
        Schema::dropIfExists('notification_channels');
    }
};
