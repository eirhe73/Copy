<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 系统设置：通知渠道 + 系统偏好
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('notification_channels')->insert([
            ['channel_id' => 'ch-wechat', 'channel' => 'wechat', 'name' => '微信服务通知', 'enabled' => 1, 'config' => json_encode(['templateId' => 'TM00001', 'signature' => '华西县域急危重症救治']), 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 'ch-sms', 'channel' => 'sms', 'name' => '短信通知', 'enabled' => 0, 'config' => json_encode(['signature' => '【县域急救】']), 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 'ch-inapp', 'channel' => 'inapp', 'name' => '站内消息', 'enabled' => 1, 'config' => null, 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 全局默认偏好（user_id=''）
        DB::table('system_preferences')->insert([
            ['user_id' => '', 'pref_key' => 'theme', 'pref_value' => json_encode('light'), 'created_at' => $now, 'updated_at' => $now],
            ['user_id' => '', 'pref_key' => 'locale', 'pref_value' => json_encode('zh-CN'), 'created_at' => $now, 'updated_at' => $now],
            ['user_id' => '', 'pref_key' => 'notification', 'pref_value' => json_encode(['tone' => 'warn', 'wechat' => true, 'sms' => false, 'inapp' => true]), 'created_at' => $now, 'updated_at' => $now],
            ['user_id' => '', 'pref_key' => 'list_density', 'pref_value' => json_encode('comfortable'), 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
