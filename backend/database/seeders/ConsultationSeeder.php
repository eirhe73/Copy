<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 远程会诊：会话 / 会诊室 / 参与人 / 共享资料 / 会诊意见
 *
 * status：0待接诊(WAITING) 1会诊中(IN_CALL) 2已结束(FINISHED)
 * token：会诊室 UUID，consult_rooms.consult_code 取 token 前 6 位
 */
class ConsultationSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        $tokens = [
            1 => '11111111-1111-1111-1111-111111111111',
            2 => '22222222-2222-2222-2222-222222222222',
            3 => '33333333-3333-3333-3333-333333333333',
            4 => '44444444-4444-4444-4444-444444444444',
        ];
        $patients = [
            1 => 'PAT-'.$ymd.'-001',
            2 => 'PAT-'.$ymd.'-002',
            3 => 'PAT-'.$ymd.'-008',
            4 => 'PAT-'.$ymd.'-006',
        ];
        $sessions = fn (int $i) => "consult-{$ymd}-".str_pad((string) $i, 3, '0', STR_PAD_LEFT);

        DB::table('consult_sessions')->insert([
            [
                'id' => 1, 'session_id' => $sessions(1), 'token' => $tokens[1],
                'consult_code' => '111111', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => $patients[1], 'patient_name' => '王秀兰', 'patient_gender' => 1, 'patient_age' => 68,
                'chief_complaint' => '突发胸痛1小时', 'task120_id' => "120-{$ymd}-01",
                'source_hospital' => '连界镇中心卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '心血管内科',
                'nominated_doctor_id' => 'doctor_zhang', 'accepted_by' => null, 'accepted_by_name' => null,
                'accepted_at' => null, 'opened_at' => null, 'closed_at' => null, 'note' => '需 PCI 评估',
                'status' => 0, 'created_at' => $now->copy()->subMinutes(18), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'session_id' => $sessions(2), 'token' => $tokens[2],
                'consult_code' => '222222', 'mode' => 'standalone', 'compatible120' => 1,
                'patient_id' => $patients[2], 'patient_name' => '李国强', 'patient_gender' => 0, 'patient_age' => 63,
                'chief_complaint' => '意识模糊伴呕吐2小时', 'task120_id' => "120-{$ymd}-02",
                'source_hospital' => '连界镇中心卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '神经内科',
                'nominated_doctor_id' => 'doctor_liu', 'accepted_by' => 'doctor_liu', 'accepted_by_name' => '刘敏',
                'accepted_at' => $at(9, 30), 'opened_at' => $at(9, 31), 'closed_at' => null, 'note' => '卒中溶栓评估中',
                'status' => 1, 'created_at' => $now->copy()->subMinutes(25), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'session_id' => $sessions(3), 'token' => $tokens[3],
                'consult_code' => '333333', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => $patients[3], 'patient_name' => '孙志强', 'patient_gender' => 0, 'patient_age' => 77,
                'chief_complaint' => '心悸、黑矇', 'task120_id' => null,
                'source_hospital' => '威远县人民医院', 'source_department' => '心血管内科',
                'hospital' => '四川大学华西医院', 'department' => '心血管内科',
                'nominated_doctor_id' => 'doctor_liu', 'accepted_by' => 'doctor_liu', 'accepted_by_name' => '刘敏',
                'accepted_at' => $at(7, 50), 'opened_at' => $at(7, 52), 'closed_at' => $at(8, 40), 'note' => '已完成远程指导',
                'status' => 2, 'created_at' => $now->copy()->subHours(3), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'session_id' => $sessions(4), 'token' => $tokens[4],
                'consult_code' => '444444', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => $patients[4], 'patient_name' => '赵德海', 'patient_gender' => 0, 'patient_age' => 71,
                'chief_complaint' => '呼吸困难加重2天', 'task120_id' => null,
                'source_hospital' => '新场镇卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '呼吸内科',
                'nominated_doctor_id' => null, 'accepted_by' => null, 'accepted_by_name' => null,
                'accepted_at' => null, 'opened_at' => null, 'closed_at' => null, 'note' => '待呼吸内科接诊',
                'status' => 0, 'created_at' => $now->copy()->subMinutes(10), 'updated_at' => $now,
            ],
        ]);

        $roomName = fn (string $name, string $hospital, string $department) => $name.' · '.$hospital.' · '.$department;

        DB::table('consult_rooms')->insert([
            [
                'id' => 1, 'token' => $tokens[1], 'consult_code' => '111111',
                'session_id' => $sessions(1), 'patient_id' => $patients[1],
                'room_name' => $roomName('王秀兰', '威远县人民医院', '心血管内科'),
                'media_mode' => 'PLACEHOLDER', 'rtc_url' => null, 'status' => 0,
                'opened_at' => null, 'closed_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'token' => $tokens[2], 'consult_code' => '222222',
                'session_id' => $sessions(2), 'patient_id' => $patients[2],
                'room_name' => $roomName('李国强', '威远县人民医院', '神经内科'),
                'media_mode' => 'PLACEHOLDER', 'rtc_url' => null, 'status' => 1,
                'opened_at' => $at(9, 31), 'closed_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'token' => $tokens[3], 'consult_code' => '333333',
                'session_id' => $sessions(3), 'patient_id' => $patients[3],
                'room_name' => $roomName('孙志强', '四川大学华西医院', '心血管内科'),
                'media_mode' => 'PLACEHOLDER', 'rtc_url' => null, 'status' => 2,
                'opened_at' => $at(7, 52), 'closed_at' => $at(8, 40), 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'token' => $tokens[4], 'consult_code' => '444444',
                'session_id' => $sessions(4), 'patient_id' => $patients[4],
                'room_name' => $roomName('赵德海', '威远县人民医院', '呼吸内科'),
                'media_mode' => 'PLACEHOLDER', 'rtc_url' => null, 'status' => 0,
                'opened_at' => null, 'closed_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('consult_participants')->insert([
            ['id' => 1, 'session_id' => $sessions(1), 'role' => '发起医生', 'name' => '李明', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(18), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'session_id' => $sessions(1), 'role' => '接诊医生', 'name' => '张伟', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'session_id' => $sessions(2), 'role' => '发起医生', 'name' => '李明', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(25), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'session_id' => $sessions(2), 'role' => '接诊医生', 'name' => '刘敏', 'online' => 1, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => now()->subMinutes(24), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'session_id' => $sessions(3), 'role' => '发起医生', 'name' => '张伟', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'link', 'joined_at' => now()->subHours(3), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'session_id' => $sessions(3), 'role' => '接诊医生', 'name' => '刘敏', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => now()->subHours(3), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'session_id' => $sessions(4), 'role' => '发起医生', 'name' => '何医生', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(10), 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('consult_materials')->insert([
            ['id' => 1, 'room_token' => $tokens[1], 'session_id' => $sessions(1), 'patient_id' => $patients[1], 'kind' => '检验记录', 'title' => '心肌酶谱', 'content' => 'cTnI 1.8 ng/mL 升高', 'source' => 'lis', 'author_id' => 'doctor_li', 'author_name' => '李明', 'shared_at' => now()->subMinutes(15), 'created_at' => $now],
            ['id' => 2, 'room_token' => $tokens[1], 'session_id' => $sessions(1), 'patient_id' => $patients[1], 'kind' => '评估记录', 'title' => '心电图判读', 'content' => 'ST 段抬高，考虑下壁心梗', 'source' => 'local', 'author_id' => 'doctor_li', 'author_name' => '李明', 'shared_at' => now()->subMinutes(14), 'created_at' => $now],
            ['id' => 3, 'room_token' => $tokens[2], 'session_id' => $sessions(2), 'patient_id' => $patients[2], 'kind' => '护理记录', 'title' => '入院护理评估', 'content' => '意识模糊，GCS 13 分', 'source' => 'emr', 'author_id' => 'nurse_chen', 'author_name' => '陈静', 'shared_at' => now()->subMinutes(22), 'created_at' => $now],
            ['id' => 4, 'room_token' => $tokens[3], 'session_id' => $sessions(3), 'patient_id' => $patients[3], 'kind' => '病程记录', 'title' => '动态心电图报告', 'content' => '阵发性房颤', 'source' => 'his', 'author_id' => 'doctor_zhang', 'author_name' => '张伟', 'shared_at' => now()->subHours(3), 'created_at' => $now],
            ['id' => 5, 'room_token' => $tokens[4], 'session_id' => $sessions(4), 'patient_id' => $patients[4], 'kind' => '检验记录', 'title' => '动脉血气分析', 'content' => 'PaO2 58 mmHg，PaCO2 56 mmHg', 'source' => 'lis', 'author_id' => 'doctor_he', 'author_name' => '何医生', 'shared_at' => now()->subMinutes(8), 'created_at' => $now],
        ]);

        DB::table('consult_opinions')->insert([
            ['id' => 1, 'room_token' => $tokens[3], 'session_id' => $sessions(3), 'doctor_id' => 'doctor_liu', 'doctor_name' => '刘敏', 'content' => '房颤患者建议评估抗凝指征，CHA2DS2-VASc 评分 4 分。', 'feedback' => json_encode([['by' => 'doctor_zhang', 'at' => $at(8, 20)->toIso8601String(), 'value' => '已执行']], JSON_UNESCAPED_UNICODE), 'submitted_at' => now()->subHours(2), 'created_at' => $now],
            ['id' => 2, 'room_token' => $tokens[3], 'session_id' => $sessions(3), 'doctor_id' => 'doctor_zhang', 'doctor_name' => '张伟', 'content' => '房颤患者转回后继续口服抗凝，2 周后复查动态心电图。', 'feedback' => json_encode([['by' => 'doctor_liu', 'at' => $at(8, 35)->toIso8601String(), 'value' => '已收到']], JSON_UNESCAPED_UNICODE), 'submitted_at' => now()->subHours(1), 'created_at' => $now],
        ]);
    }
}
