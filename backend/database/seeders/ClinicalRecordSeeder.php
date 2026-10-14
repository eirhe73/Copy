<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 基层诊疗记录
 *
 * record_type：OUTPATIENT门诊 / EMERGENCY急诊 / FOLLOW_UP随访
 */
class ClinicalRecordSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        DB::table('clinical_records')->insert([
            [
                'id' => 1, 'record_code' => "CR-{$ymd}-001", 'patient_id' => 1, 'doctor_user_id' => 2, 'org_id' => 2,
                'record_type' => 'EMERGENCY', 'chief_complaint' => '突发胸痛1小时',
                'present_history' => '1小时前无明显诱因出现胸骨后压榨样疼痛', 'diagnosis' => '急性冠脉综合征',
                'treatment' => '吸氧、心电监护、阿司匹林嚼服，转上级医院', 'visit_at' => $at(8, 25),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'record_code' => "CR-{$ymd}-002", 'patient_id' => 2, 'doctor_user_id' => 7, 'org_id' => 3,
                'record_type' => 'EMERGENCY', 'chief_complaint' => '意识模糊伴呕吐2小时',
                'present_history' => '2小时前突发意识模糊，伴恶心呕吐', 'diagnosis' => '急性脑血管病',
                'treatment' => '保持气道通畅，控制血压，转诊威远县人民医院', 'visit_at' => $at(9, 15),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'record_code' => "CR-{$ymd}-003", 'patient_id' => 3, 'doctor_user_id' => 4, 'org_id' => 2,
                'record_type' => 'OUTPATIENT', 'chief_complaint' => '头晕、行走不稳1天',
                'present_history' => '1天前出现头晕，行走不稳', 'diagnosis' => '后循环缺血',
                'treatment' => '改善循环、抗血小板治疗，门诊随访', 'visit_at' => $at(10, 10),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'record_code' => "CR-{$ymd}-004", 'patient_id' => 8, 'doctor_user_id' => 2, 'org_id' => 2,
                'record_type' => 'FOLLOW_UP', 'chief_complaint' => '心悸、黑矇',
                'present_history' => '既往房颤病史，近期间断心悸', 'diagnosis' => '心房颤动',
                'treatment' => '评估抗凝指征，调整药物', 'visit_at' => $at(11, 30),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'record_code' => "CR-{$ymd}-005", 'patient_id' => 4, 'doctor_user_id' => 2, 'org_id' => 2,
                'record_type' => 'OUTPATIENT', 'chief_complaint' => '左下肢疼痛1小时',
                'present_history' => '车祸后左下肢疼痛、活动受限', 'diagnosis' => '左胫腓骨骨折',
                'treatment' => '夹板固定，转骨科进一步诊治', 'visit_at' => $at(12, 40),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
