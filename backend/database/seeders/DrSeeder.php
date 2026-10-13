<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 基层医生 Dr：基层反馈/问题上报（dr_posts）+ 协作消息（dr_messages）
 */
class DrSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('dr_posts')->insert([
            [
                'post_id' => 'DR-POST-1001', 'category' => 'FEEDBACK', 'title' => '120 转运交接反馈',
                'content' => '近期胸部急症患者上转，交接单填写不完整，影响接诊评估。',
                'institution_id' => 'LJ001', 'institution_name' => '连界镇中心卫生院',
                'department' => '急诊科', 'reporter_id' => 'doctor_li', 'reporter_name' => '李明',
                'contact' => '', 'priority' => 1, 'status' => 'REPLIED',
                'reply' => '已优化交接单模板，并通知 120 班组按要求填写。', 'replied_by' => 'admin', 'replied_at' => '2026-10-12 10:05:00',
                'attachments' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'post_id' => 'DR-POST-1002', 'category' => 'ISSUE', 'title' => '危急值回报超时',
                'content' => '检验危急值未能在 30 分钟内回报，影响处置时效。',
                'institution_id' => 'WY001', 'institution_name' => '威远县人民医院',
                'department' => '检验科', 'reporter_id' => 'doctor_wang', 'reporter_name' => '王建国',
                'contact' => '', 'priority' => 1, 'status' => 'PENDING',
                'reply' => null, 'replied_by' => '', 'replied_at' => null,
                'attachments' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('dr_messages')->insert([
            [
                'message_id' => 'DR-MSG-1001', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'WY001', 'institution_name' => '威远县人民医院',
                'sender_id' => 'doctor_liu', 'sender_name' => '刘敏',
                'kind' => 'VOICE', 'content' => '', 'media_url' => 'https://host/media/dr-voice-1001.mp3',
                'duration_sec' => 32, 'is_read' => 1, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'message_id' => 'DR-MSG-1000', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'LJ001', 'institution_name' => '连界镇中心卫生院',
                'sender_id' => 'doctor_li', 'sender_name' => '李明',
                'kind' => 'TEXT', 'content' => '患者已开始转运，预计 30 分钟到院。', 'media_url' => '',
                'duration_sec' => 0, 'is_read' => 1, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
