<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 远程会诊：会话 / 参与人 / 共享资料 / 会诊意见
 *
 * status：0待接诊(WAITING) 1会诊中(IN_CALL) 2已结束(FINISHED)
 */
class ConsultationSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        DB::table('consult_sessions')->insert([
            [
                'id' => 1, 'session_id' => "consult-{$ymd}-001", 'token' => '11111111-1111-1111-1111-111111111111',
                'consult_code' => '111111', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => 'PAT-'.now()->format('Ymd').'-001', 'patient_name' => '王秀兰', 'patient_gender' => 1, 'patient_age' => 68,
                'chief_complaint' => '突发胸痛1小时', 'task120_id' => "120-{$ymd}-01",
                'source_hospital' => '连界镇中心卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '心血管内科',
                'nominated_doctor_id' => 'doctor_zhang', 'accepted_by' => null, 'accepted_by_name' => null,
                'accepted_at' => null, 'opened_at' => null, 'closed_at' => null, 'note' => '需 PCI 评估',
                'status' => 0, 'created_at' => $now->copy()->subMinutes(18), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'session_id' => "consult-{$ymd}-002", 'token' => '22222222-2222-2222-2222-222222222222',
                'consult_code' => '222222', 'mode' => 'standalone', 'compatible120' => 1,
                'patient_id' => 'PAT-'.now()->format('Ymd').'-002', 'patient_name' => '李国强', 'patient_gender' => 0, 'patient_age' => 63,
                'chief_complaint' => '意识模糊伴呕吐2小时', 'task120_id' => "120-{$ymd}-02",
                'source_hospital' => '连界镇中心卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '神经内科',
                'nominated_doctor_id' => 'doctor_liu', 'accepted_by' => 'doctor_liu', 'accepted_by_name' => '刘敏',
                'accepted_at' => $at(9, 30), 'opened_at' => $at(9, 31), 'closed_at' => null, 'note' => '卒中溶栓评估中',
                'status' => 1, 'created_at' => $now->copy()->subMinutes(25), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'session_id' => "consult-{$ymd}-003", 'token' => '33333333-3333-3333-3333-333333333333',
                'consult_code' => '333333', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => 'PAT-'.now()->format('Ymd').'-008', 'patient_name' => '孙志强', 'patient_gender' => 0, 'patient_age' => 77,
                'chief_complaint' => '心悸、黑矇', 'task120_id' => null,
                'source_hospital' => '威远县人民医院', 'source_department' => '心血管内科',
                'hospital' => '四川大学华西医院', 'department' => '心血管内科',
                'nominated_doctor_id' => 'doctor_liu', 'accepted_by' => 'doctor_liu', 'accepted_by_name' => '刘敏',
                'accepted_at' => $at(7, 50), 'opened_at' => $at(7, 52), 'closed_at' => $at(8, 40), 'note' => '已完成远程指导',
                'status' => 2, 'created_at' => $now->copy()->subHours(3), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'session_id' => "consult-{$ymd}-004", 'token' => '44444444-4444-4444-4444-444444444444',
                'consult_code' => '444444', 'mode' => 'standalone', 'compatible120' => 0,
                'patient_id' => 'PAT-'.now()->format('Ymd').'-006', 'patient_name' => '赵德海', 'patient_gender' => 0, 'patient_age' => 71,
                'chief_complaint' => '呼吸困难加重2天', 'task120_id' => null,
                'source_hospital' => '新场镇卫生院', 'source_department' => '急诊科',
                'hospital' => '威远县人民医院', 'department' => '呼吸内科',
                'nominated_doctor_id' => null, 'accepted_by' => null, 'accepted_by_name' => null,
                'accepted_at' => null, 'opened_at' => null, 'closed_at' => null, 'note' => '待呼吸内科接诊',
                'status' => 0, 'created_at' => $now->copy()->subMinutes(10), 'updated_at' => $now,
            ],
        ]);

        $ymd = now()->format('Ymd');

        DB::table('consult_participants')->insert([
            ['id' => 1, 'session_id' => "consult-{$ymd}-001", 'role' => '发起医生', 'name' => '李明', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(18), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'session_id' => "consult-{$ymd}-001", 'role' => '接诊医生', 'name' => '张伟', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'session_id' => "consult-{$ymd}-002", 'role' => '发起医生', 'name' => '李明', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(25), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'session_id' => "consult-{$ymd}-002", 'role' => '接诊医生', 'name' => '刘敏', 'online' => 1, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => now()->subMinutes(24), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'session_id' => "consult-{$ymd}-003", 'role' => '发起医生', 'name' => '张伟', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'link', 'joined_at' => now()->subHours(3), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'session_id' => "consult-{$ymd}-003", 'role' => '接诊医生', 'name' => '刘敏', 'online' => 0, 'device_type' => 'web', 'join_mode' => 'code', 'joined_at' => now()->subHours(3), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'session_id' => "consult-{$ymd}-004", 'role' => '发起医生', 'name' => '何医生', 'online' => 1, 'device_type' => 'mobile', 'join_mode' => 'link', 'joined_at' => now()->subMinutes(10), 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('consult_materials')->insert([
            ['id' => 1, 'material_no' => 'MAT-1001', 'session_id' => "consult-{$ymd}-001", 'kind' => '检验记录', 'title' => '心肌酶谱', 'content' => 'cTnI 1.8 ng/mL 升高', 'source' => 'lis', 'author_name' => '李明', 'shared_at' => now()->subMinutes(15), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'material_no' => 'MAT-1002', 'session_id' => "consult-{$ymd}-001", 'kind' => '评估记录', 'title' => '心电图判读', 'content' => 'ST 段抬高，考虑下壁心梗', 'source' => 'local', 'author_name' => '李明', 'shared_at' => now()->subMinutes(14), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'material_no' => 'MAT-1003', 'session_id' => "consult-{$ymd}-002", 'kind' => '护理记录', 'title' => '入院护理评估', 'content' => '意识模糊，GCS 13 分', 'source' => 'emr', 'author_name' => '陈静', 'shared_at' => now()->subMinutes(22), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'material_no' => 'MAT-1004', 'session_id' => "consult-{$ymd}-003", 'kind' => '病程记录', 'title' => '动态心电图报告', 'content' => '阵发性房颤', 'source' => 'his', 'author_name' => '张伟', 'shared_at' => now()->subHours(3), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'material_no' => 'MAT-1005', 'session_id' => "consult-{$ymd}-004", 'kind' => '检验记录', 'title' => '动脉血气分析', 'content' => 'PaO2 58 mmHg，PaCO2 56 mmHg', 'source' => 'lis', 'author_name' => '何医生', 'shared_at' => now()->subMinutes(8), 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('consult_opinions')->insert([
            ['id' => 1, 'opinion_no' => 'OPI-1001', 'session_id' => "consult-{$ymd}-002", 'content' => '建议立即启动卒中绿色通道，完善头颅 CT 并评估静脉溶栓适应证。', 'doctor_id' => 'doctor_liu', 'doctor_name' => '刘敏', 'feedback' => '已执行', 'submitted_at' => now()->subMinutes(18), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'opinion_no' => 'OPI-1002', 'session_id' => "consult-{$ymd}-003", 'content' => '房颤患者建议评估抗凝指征，CHA2DS2-VASc 评分 4 分。', 'doctor_id' => 'doctor_liu', 'doctor_name' => '刘敏', 'feedback' => '已执行', 'submitted_at' => now()->subHours(2), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'opinion_no' => 'OPI-1003', 'session_id' => "consult-{$ymd}-001", 'content' => '转院途中持续心电监护，到院后直接绕行急诊进入导管室。', 'doctor_id' => 'doctor_zhang', 'doctor_name' => '张伟', 'feedback' => '', 'submitted_at' => now()->subMinutes(10), 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
