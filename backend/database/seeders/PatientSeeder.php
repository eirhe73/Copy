<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 患者基础数据（含院前上报明细）
 *
 * gender：0男 1女 2未知
 * stage：registered / transfer-requested / admitted
 * source：manual / 120
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $at = fn (int $hour, int $minute) => now()->startOfDay()->copy()->addHours($hour)->addMinutes($minute);

        $patients = [
            [
                'id' => 1, 'name' => '王秀兰', 'gender' => 1, 'age' => 68, 'id_card' => '511024195803120012', 'phone' => '13600000001',
                'institution_id' => 'WY001', 'department_id' => 'CARDIO',
                'assigned_to' => ['WY001-CARDIO-doctor'],
                'stage' => 'admitted', 'chief_complaint' => '突发胸痛1小时',
                'symptoms' => ['胸痛', '大汗', '恶心'],
                'notes' => '本地虚构演示记录，不是真实病历，不用于临床判断。',
                'source' => 'manual',
                'prehospital' => ['complaint' => '突发胸痛1小时', 'symptoms' => ['胸痛', '大汗', '恶心']],
                'consultation_token' => 'xun-2026-0001', 'consultation_doctor_id' => 'weiyuan-emergency-doctor', 'consultation_request_id' => 'CR-F-001',
                'admitted_at' => $at(8, 30), 'is_draft' => 0,
            ],
            [
                'id' => 2, 'name' => '李国强', 'gender' => 0, 'age' => 63, 'id_card' => '511024196304120013', 'phone' => '13600000002',
                'institution_id' => 'LJ001', 'department_id' => 'EMERGENCY',
                'assigned_to' => ['LJ001-EMERGENCY-doctor'],
                'stage' => 'admitted', 'chief_complaint' => '意识模糊伴呕吐2小时',
                'symptoms' => ['意识模糊', '呕吐'],
                'notes' => null,
                'source' => 'manual',
                'prehospital' => ['complaint' => '意识模糊伴呕吐2小时', 'symptoms' => ['意识模糊', '呕吐']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => $at(9, 40), 'is_draft' => 0,
            ],
            [
                'id' => 3, 'name' => '张桂英', 'gender' => 1, 'age' => 56, 'id_card' => '511024197008200014', 'phone' => '13600000003',
                'institution_id' => 'XC001', 'department_id' => 'EMERGENCY',
                'assigned_to' => ['XC001-EMERGENCY-doctor'],
                'stage' => 'admitted', 'chief_complaint' => '言语不清、右侧肢体无力1小时',
                'symptoms' => ['言语不清', '肢体无力'],
                'notes' => null,
                'source' => 'manual',
                'prehospital' => ['complaint' => '言语不清、右侧肢体无力1小时', 'symptoms' => ['言语不清', '肢体无力']],
                'consultation_token' => 'xun-2026-0003', 'consultation_doctor_id' => 'weiyuan-emergency-doctor', 'consultation_request_id' => 'CR-F-003',
                'admitted_at' => $at(8, 30), 'is_draft' => 0,
            ],
            [
                'id' => 4, 'name' => '陈建军', 'gender' => 0, 'age' => 41, 'id_card' => '511024198511020015', 'phone' => '13600000004',
                'institution_id' => 'WY001', 'department_id' => 'EMERGENCY',
                'assigned_to' => ['WY001-EMERGENCY-doctor'],
                'stage' => 'registered', 'chief_complaint' => '车祸外伤、左下肢疼痛',
                'symptoms' => ['外伤', '疼痛'],
                'notes' => null,
                'source' => 'manual',
                'prehospital' => ['complaint' => '车祸外伤、左下肢疼痛', 'symptoms' => ['外伤', '疼痛']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => null, 'is_draft' => 0,
            ],
            [
                'id' => 5, 'name' => '刘芳', 'gender' => 1, 'age' => 34, 'id_card' => '511024199206180016', 'phone' => '13600000005',
                'institution_id' => 'LJ001', 'department_id' => 'GEN',
                'assigned_to' => ['LJ001-GEN-doctor'],
                'stage' => 'transfer-requested', 'chief_complaint' => '孕晚期腹痛、阴道流血',
                'symptoms' => ['腹痛', '阴道流血'],
                'notes' => null,
                'source' => '120',
                'prehospital' => ['complaint' => '孕晚期腹痛、阴道流血', 'symptoms' => ['腹痛', '阴道流血']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => null, 'is_draft' => 0,
            ],
            [
                'id' => 6, 'name' => '赵德海', 'gender' => 0, 'age' => 71, 'id_card' => '511024195501300017', 'phone' => '13600000006',
                'institution_id' => 'XC001', 'department_id' => 'RESP',
                'assigned_to' => ['XC001-RESP-doctor'],
                'stage' => 'transfer-requested', 'chief_complaint' => '呼吸困难加重2天',
                'symptoms' => ['呼吸困难', '咳嗽'],
                'notes' => null,
                'source' => '120',
                'prehospital' => ['complaint' => '呼吸困难加重2天', 'symptoms' => ['呼吸困难', '咳嗽']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => null, 'is_draft' => 0,
            ],
            [
                'id' => 7, 'name' => '周敏', 'gender' => 1, 'age' => 28, 'id_card' => '511024199809090018', 'phone' => '13600000007',
                'institution_id' => 'LJ001', 'department_id' => 'EMERGENCY',
                'assigned_to' => ['LJ001-EMERGENCY-doctor'],
                'stage' => 'registered', 'chief_complaint' => '高热惊厥',
                'symptoms' => ['发热', '抽搐'],
                'notes' => null,
                'source' => 'manual',
                'prehospital' => ['complaint' => '高热惊厥', 'symptoms' => ['发热', '抽搐']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => null, 'is_draft' => 1,
            ],
            [
                'id' => 8, 'name' => '孙志强', 'gender' => 0, 'age' => 77, 'id_card' => '511024194912250019', 'phone' => '13600000008',
                'institution_id' => 'WY001', 'department_id' => 'CARDIO',
                'assigned_to' => ['WY001-CARDIO-doctor'],
                'stage' => 'admitted', 'chief_complaint' => '心悸、黑矇',
                'symptoms' => ['心悸', '黑矇'],
                'notes' => null,
                'source' => 'manual',
                'prehospital' => ['complaint' => '心悸、黑矇', 'symptoms' => ['心悸', '黑矇']],
                'consultation_token' => null, 'consultation_doctor_id' => null, 'consultation_request_id' => null,
                'admitted_at' => $at(10, 15), 'is_draft' => 0,
            ],
        ];

        foreach ($patients as $index => $patient) {
            // json 列需手动编码，DB 门面 insert 不会自动转换数组
            foreach (['assigned_to', 'symptoms', 'prehospital'] as $jsonColumn) {
                if (isset($patient[$jsonColumn]) && is_array($patient[$jsonColumn])) {
                    $patient[$jsonColumn] = json_encode($patient[$jsonColumn], JSON_UNESCAPED_UNICODE);
                }
            }

            $patients[$index] = array_merge([
                'patient_id' => sprintf('PAT-%s-%03d', $ymd, $index + 1),
                'source_record_id' => sprintf('MOBILE-PAT-%03d', $index + 1),
                'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ], $patient);
        }

        DB::table('patients')->insert($patients);
    }
}
