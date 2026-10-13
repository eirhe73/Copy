<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 患者基础数据（含院前上报明细）
 *
 * gender：GENDER_MALE/GENDER_FEMALE
 * stage：registered / transfer-requested / admitted
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');

        $patients = [
            [
                'id' => 1, 'real_name' => '王秀兰', 'gender' => 'GENDER_FEMALE', 'birth_date' => '1958-03-12',
                'age' => 68, 'id_card' => '511024195803120012', 'phone' => '13600000001',
                'address' => '四川省内江市威远县严陵镇建设街12号',
                'medical_history' => '高血压病史10年', 'allergy_history' => '青霉素过敏',
                'prehospital' => ['complaint' => '突发胸痛1小时', 'symptoms' => ['胸痛', '大汗', '恶心']],
                'is_draft' => 0, 'entry' => 'field', 'stage' => 'admitted',
                'source_record_id' => 'MOBILE-PAT-001', 'institution_id' => 'WY001', 'department_id' => 'CARDIO',
            ],
            [
                'id' => 2, 'real_name' => '李国强', 'gender' => 'GENDER_MALE', 'birth_date' => '1963-04-12',
                'age' => 63, 'id_card' => '511024196304120013', 'phone' => '13600000002',
                'address' => '四川省内江市威远县连界镇连界街88号',
                'medical_history' => '冠心病、2型糖尿病', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '意识模糊伴呕吐2小时', 'symptoms' => ['意识模糊', '呕吐']],
                'is_draft' => 0, 'entry' => 'field', 'stage' => 'admitted',
                'source_record_id' => 'MOBILE-PAT-002', 'institution_id' => 'LJ001', 'department_id' => 'EMERGENCY',
            ],
            [
                'id' => 3, 'real_name' => '张桂英', 'gender' => 'GENDER_FEMALE', 'birth_date' => '1970-08-20',
                'age' => 56, 'id_card' => '511024197008200014', 'phone' => '13600000003',
                'address' => '四川省内江市威远县新场镇兴新街6号',
                'medical_history' => '脑梗死病史', 'allergy_history' => '磺胺过敏',
                'prehospital' => ['complaint' => '言语不清、右侧肢体无力1小时', 'symptoms' => ['言语不清', '肢体无力']],
                'is_draft' => 0, 'entry' => 'field', 'stage' => 'admitted',
                'source_record_id' => 'MOBILE-PAT-003', 'institution_id' => 'XC001', 'department_id' => 'EMERGENCY',
            ],
            [
                'id' => 4, 'real_name' => '陈建军', 'gender' => 'GENDER_MALE', 'birth_date' => '1985-11-02',
                'age' => 41, 'id_card' => '511024198511020015', 'phone' => '13600000004',
                'address' => '四川省内江市威远县越溪镇越溪村3组',
                'medical_history' => '无特殊', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '车祸外伤、左下肢疼痛', 'symptoms' => ['外伤', '疼痛']],
                'is_draft' => 0, 'entry' => 'field', 'stage' => 'registered',
                'source_record_id' => 'MOBILE-PAT-004', 'institution_id' => 'WY001', 'department_id' => 'EMERGENCY',
            ],
            [
                'id' => 5, 'real_name' => '刘芳', 'gender' => 'GENDER_FEMALE', 'birth_date' => '1992-06-18',
                'age' => 34, 'id_card' => '511024199206180016', 'phone' => '13600000005',
                'address' => '四川省内江市威远县严陵镇人民路20号',
                'medical_history' => '妊娠38周', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '孕晚期腹痛、阴道流血', 'symptoms' => ['腹痛', '阴道流血']],
                'is_draft' => 0, 'entry' => 'inpatient', 'stage' => 'transfer-requested',
                'source_record_id' => 'MOBILE-PAT-005', 'institution_id' => 'LJ001', 'department_id' => 'GEN',
            ],
            [
                'id' => 6, 'real_name' => '赵德海', 'gender' => 'GENDER_MALE', 'birth_date' => '1955-01-30',
                'age' => 71, 'id_card' => '511024195501300017', 'phone' => '13600000006',
                'address' => '四川省内江市威远县新场镇老街12号',
                'medical_history' => '慢性阻塞性肺疾病', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '呼吸困难加重2天', 'symptoms' => ['呼吸困难', '咳嗽']],
                'is_draft' => 0, 'entry' => 'field', 'stage' => 'transfer-requested',
                'source_record_id' => 'MOBILE-PAT-006', 'institution_id' => 'XC001', 'department_id' => 'RESP',
            ],
            [
                'id' => 7, 'real_name' => '周敏', 'gender' => 'GENDER_FEMALE', 'birth_date' => '1998-09-09',
                'age' => 28, 'id_card' => '511024199809090018', 'phone' => '13600000007',
                'address' => '四川省内江市威远县连界镇连界街3号',
                'medical_history' => '无特殊', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '高热惊厥', 'symptoms' => ['发热', '抽搐']],
                'is_draft' => 1, 'entry' => 'field', 'stage' => 'registered',
                'source_record_id' => 'MOBILE-PAT-007', 'institution_id' => 'LJ001', 'department_id' => 'EMERGENCY',
            ],
            [
                'id' => 8, 'real_name' => '孙志强', 'gender' => 'GENDER_MALE', 'birth_date' => '1949-12-25',
                'age' => 77, 'id_card' => '511024194912250019', 'phone' => '13600000008',
                'address' => '四川省内江市威远县严陵镇西街9号',
                'medical_history' => '心房颤动', 'allergy_history' => '无',
                'prehospital' => ['complaint' => '心悸、黑矇', 'symptoms' => ['心悸', '黑矇']],
                'is_draft' => 0, 'entry' => 'inpatient', 'stage' => 'admitted',
                'source_record_id' => 'MOBILE-PAT-008', 'institution_id' => 'WY001', 'department_id' => 'CARDIO',
            ],
        ];

        foreach ($patients as $index => $patient) {
            // json 列需手动编码，DB 门面 insert 不会自动转换数组
            if (isset($patient['prehospital']) && is_array($patient['prehospital'])) {
                $patient['prehospital'] = json_encode($patient['prehospital'], JSON_UNESCAPED_UNICODE);
            }

            $patients[$index] = array_merge([
                'patient_code' => sprintf('PAT-%s-%03d', $ymd, $index + 1),
                'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ], $patient);
        }

        DB::table('patients')->insert($patients);
    }
}
