<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 基层医声 Dr：基层反馈 / 问题上报 + 协作消息（04-会诊协同）
 *
 * category：0基层反馈1问题上报；status：0待处理1已回复2已办结；kind：0文字1语音2图片3文件
 */
class DrSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // dr_posts：覆盖 category 0/1 与 status 0/1/2
        DB::table('dr_posts')->insert([
            [
                'id' => 1, 'post_id' => 'DR-POST-1001', 'category' => 0,
                'title' => '120 转运交接反馈',
                'content' => '近期胸部急症患者上转，交接单填写不完整，影响接诊评估。',
                'institution_id' => 'lianjie', 'institution_name' => '连界镇卫生院',
                'department' => '急诊科', 'reporter_id' => 'doctor-zhang', 'reporter_name' => '张医生',
                'contact' => '13800001111', 'priority' => 1, 'status' => 1,
                'reply' => '已优化交接单模板，并通知 120 班组按要求填写。',
                'replied_by' => 'admin-weiyuan', 'replied_at' => $now->copy()->subMinutes(30),
                'attachments' => null, 'created_at' => $now->copy()->subHours(1), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'post_id' => 'DR-POST-1002', 'category' => 1,
                'title' => '危急值回报超时',
                'content' => '检验危急值未能在 30 分钟内回报，影响处置时效。',
                'institution_id' => 'lianjie', 'institution_name' => '连界镇卫生院',
                'department' => '检验科', 'reporter_id' => 'doctor-zhang', 'reporter_name' => '张医生',
                'contact' => '13800001111', 'priority' => 1, 'status' => 0,
                'reply' => null, 'replied_by' => '', 'replied_at' => null,
                'attachments' => null, 'created_at' => $now->copy()->subMinutes(12), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'post_id' => 'DR-POST-1003', 'category' => 1,
                'title' => '网络中断影响会诊接入',
                'content' => '远程会诊过程中网络频繁中断，建议排查基层接入带宽。',
                'institution_id' => 'xinchang', 'institution_name' => '新场镇卫生院',
                'department' => '信息科', 'reporter_id' => 'doctor-li', 'reporter_name' => '李医生',
                'contact' => '', 'priority' => 0, 'status' => 1,
                'reply' => '已联系运营商扩容，本周内完成。',
                'replied_by' => 'admin-weiyuan', 'replied_at' => $now->copy()->subMinutes(50),
                'attachments' => json_encode(['https://host/media/dr-post-1003.png']),
                'created_at' => $now->copy()->subHours(2), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'post_id' => 'DR-POST-1004', 'category' => 0,
                'title' => 'DR 影像调阅体验反馈',
                'content' => '希望基层端可直接调阅上级影像报告，减少电话沟通。',
                'institution_id' => 'lianjie', 'institution_name' => '连界镇卫生院',
                'department' => '放射科', 'reporter_id' => 'doctor-zhang', 'reporter_name' => '张医生',
                'contact' => '', 'priority' => 0, 'status' => 2,
                'reply' => '影像报告共享功能已上线。',
                'replied_by' => 'admin-weiyuan', 'replied_at' => $now->copy()->subDays(1),
                'attachments' => null, 'created_at' => $now->copy()->subDays(2), 'updated_at' => $now,
            ],
        ]);

        // dr_messages：覆盖 kind 0~3 与 is_read 0/1
        DB::table('dr_messages')->insert([
            [
                'id' => 1, 'message_id' => 'DR-MSG-1000', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'lianjie', 'institution_name' => '连界镇卫生院',
                'sender_id' => 'doctor-zhang', 'sender_name' => '张医生', 'kind' => 0,
                'content' => '患者已开始转运，预计 30 分钟到院。', 'media_url' => '',
                'duration_sec' => 0, 'is_read' => 1, 'created_at' => $now->copy()->subMinutes(30),
            ],
            [
                'id' => 2, 'message_id' => 'DR-MSG-1001', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'weiyuan', 'institution_name' => '威远县人民医院',
                'sender_id' => 'director-wang', 'sender_name' => '王主任', 'kind' => 1,
                'content' => '', 'media_url' => 'https://host/media/dr-voice-1001.mp3',
                'duration_sec' => 32, 'is_read' => 0, 'created_at' => $now->copy()->subMinutes(25),
            ],
            [
                'id' => 3, 'message_id' => 'DR-MSG-1002', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'lianjie', 'institution_name' => '连界镇卫生院',
                'sender_id' => 'doctor-zhang', 'sender_name' => '张医生', 'kind' => 2,
                'content' => '', 'media_url' => 'https://host/media/dr-img-1002.png',
                'duration_sec' => 0, 'is_read' => 1, 'created_at' => $now->copy()->subMinutes(20),
            ],
            [
                'id' => 4, 'message_id' => 'DR-MSG-1003', 'thread_id' => 'thread-wy-01',
                'institution_id' => 'weiyuan', 'institution_name' => '威远县人民医院',
                'sender_id' => 'director-wang', 'sender_name' => '王主任', 'kind' => 3,
                'content' => '', 'media_url' => 'https://host/media/dr-handover-1003.pdf',
                'duration_sec' => 0, 'is_read' => 0, 'created_at' => $now->copy()->subMinutes(15),
            ],
            [
                'id' => 5, 'message_id' => 'DR-MSG-1004', 'thread_id' => 'thread-lj-02',
                'institution_id' => 'xinchang', 'institution_name' => '新场镇卫生院',
                'sender_id' => 'doctor-li', 'sender_name' => '李医生', 'kind' => 1,
                'content' => '', 'media_url' => 'https://host/media/dr-voice-1004.mp3',
                'duration_sec' => 18, 'is_read' => 0, 'created_at' => $now->copy()->subMinutes(5),
            ],
        ]);
    }
}
