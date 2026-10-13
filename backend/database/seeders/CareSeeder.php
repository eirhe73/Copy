<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 基层重症监护：床-患-设备绑定 / ICU 床位 / 床旁体征 / 远程查房 / 五大中心
 */
class CareSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        $p1 = 'PAT-'.$ymd.'-001';
        $p2 = 'PAT-'.$ymd.'-002';
        $p3 = 'PAT-'.$ymd.'-003';

        // 床 / 患者 / 设备 / 摄像头四元绑定（scope：0本院 1协作 2下级）
        DB::table('care_bindings')->insert([
            ['id' => 1, 'scope' => 0, 'hospital' => '威远县人民医院', 'ward' => '重症医学科', 'bed_id' => 'WY001-ICU-01', 'bed_label' => 'ICU-01', 'patient_id' => $p3, 'patient_name' => '张桂英', 'device_id' => 'DEV-MON-001', 'device_name' => '监护仪', 'camera_id' => 'CAM-ICU-01', 'bound_at' => $at(8, 30), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'scope' => 0, 'hospital' => '威远县人民医院', 'ward' => '重症医学科', 'bed_id' => 'WY001-ICU-02', 'bed_label' => 'ICU-02', 'patient_id' => $p1, 'patient_name' => '王秀兰', 'device_id' => 'DEV-MON-002', 'device_name' => '监护仪', 'camera_id' => 'CAM-ICU-02', 'bound_at' => $at(8, 35), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'scope' => 0, 'hospital' => '威远县人民医院', 'ward' => '急诊科', 'bed_id' => 'WY001-EMERGENCY-01', 'bed_label' => '急诊-01', 'patient_id' => $p1, 'patient_name' => '王秀兰', 'device_id' => 'DEV-PUMP-001', 'device_name' => '输液泵', 'camera_id' => 'CAM-EMG-05', 'bound_at' => $at(8, 45), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'scope' => 1, 'hospital' => '连界镇中心卫生院', 'ward' => '急诊科', 'bed_id' => 'LJ001-EMERGENCY-02', 'bed_label' => '急诊-02', 'patient_id' => $p2, 'patient_name' => '李国强', 'device_id' => null, 'device_name' => null, 'camera_id' => null, 'bound_at' => $at(9, 20), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'scope' => 2, 'hospital' => '新场镇卫生院', 'ward' => '急诊科', 'bed_id' => 'XC001-EMERGENCY-03', 'bed_label' => '急诊-03', 'patient_id' => '', 'patient_name' => '', 'device_id' => null, 'device_name' => null, 'camera_id' => null, 'bound_at' => $at(10, 0), 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ICU 床位态势
        DB::table('icu_beds')->insert([
            ['id' => 1, 'bed_id' => 'WY001-ICU-01', 'label' => 'ICU-01', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'status' => 'occupied', 'patient_id' => $p3, 'patient_name' => '张桂英', 'severity' => 'critical', 'monitor_id' => 'DEV-MON-001', 'admitted_at' => $at(8, 30), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'bed_id' => 'WY001-ICU-02', 'label' => 'ICU-02', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'status' => 'occupied', 'patient_id' => $p1, 'patient_name' => '王秀兰', 'severity' => 'acute', 'monitor_id' => 'DEV-MON-002', 'admitted_at' => $at(8, 35), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'bed_id' => 'WY001-ICU-03', 'label' => 'ICU-03', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'status' => 'available', 'patient_id' => null, 'patient_name' => '', 'severity' => 'general', 'monitor_id' => null, 'admitted_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'bed_id' => 'WY001-ICU-04', 'label' => 'ICU-04', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'status' => 'available', 'patient_id' => null, 'patient_name' => '', 'severity' => 'general', 'monitor_id' => null, 'admitted_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'bed_id' => 'HX001-ICU-01', 'label' => 'ICU-01', 'institution_id' => 'HX001', 'department_id' => 'ICU', 'status' => 'occupied', 'patient_id' => $p2, 'patient_name' => '李国强', 'severity' => 'critical', 'monitor_id' => 'DEV-MON-003', 'admitted_at' => $at(9, 40), 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 床旁体征时序：patient 003 高危（news>=5），patient 001 预警（spo2<93）
        $vitals = [];
        $id = 1;
        foreach ([-90, -60, -30, -10, -3] as $offset) {
            $vitals[] = ['id' => $id++, 'patient_id' => $p3, 'heart_rate' => 112 + $id, 'spo2' => 88, 'resp' => 26, 'temp' => 37.6, 'systolic' => 92, 'diastolic' => 60, 'news' => 7, 'source' => 'device', 'measured_at' => now()->subMinutes(abs($offset)), 'created_at' => $now, 'updated_at' => $now];
        }
        foreach ([-80, -50, -20, -5] as $offset) {
            $vitals[] = ['id' => $id++, 'patient_id' => $p1, 'heart_rate' => 102 + $id, 'spo2' => 92, 'resp' => 22, 'temp' => 36.8, 'systolic' => 96, 'diastolic' => 62, 'news' => 5, 'source' => 'device', 'measured_at' => now()->subMinutes(abs($offset)), 'created_at' => $now, 'updated_at' => $now];
        }
        foreach ([-120, -40] as $offset) {
            $vitals[] = ['id' => $id++, 'patient_id' => $p2, 'heart_rate' => 88, 'spo2' => 96, 'resp' => 18, 'temp' => 36.6, 'systolic' => 150, 'diastolic' => 90, 'news' => 2, 'source' => 'device', 'measured_at' => now()->subMinutes(abs($offset)), 'created_at' => $now, 'updated_at' => $now];
        }
        DB::table('patient_vitals')->insert($vitals);

        // 远程查房会话
        DB::table('ward_rounds')->insert([
            ['id' => 1, 'round_id' => "WR-{$ymd}-001", 'ward_id' => 'ICU', 'ward_label' => '重症医学科', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'patient_id' => $p3, 'patient_label' => 'ICU 01床', 'title' => '危重患者晨间查房', 'doctor_id' => 'doctor_wang', 'doctor_name' => '王建国', 'participants' => '王建国,陈静', 'status' => 'finished', 'planned_at' => $at(8, 0), 'started_at' => $at(8, 2), 'finished_at' => $at(8, 20), 'summary' => '患者生命体征平稳，继续监护', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'round_id' => "WR-{$ymd}-002", 'ward_id' => 'ICU', 'ward_label' => '重症医学科', 'institution_id' => 'WY001', 'department_id' => 'ICU', 'patient_id' => $p1, 'patient_label' => 'ICU 02床', 'title' => '重症患者联合查房', 'doctor_id' => 'doctor_sun', 'doctor_name' => '孙丽', 'participants' => '孙丽,陈静,王建国', 'status' => 'in_progress', 'planned_at' => $at(11, 0), 'started_at' => $at(11, 5), 'finished_at' => null, 'summary' => '', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'round_id' => "WR-{$ymd}-003", 'ward_id' => 'CARDIO', 'ward_label' => '心血管内科', 'institution_id' => 'WY001', 'department_id' => 'CARDIO', 'patient_id' => null, 'patient_label' => '', 'title' => '心内科床旁交接查房', 'doctor_id' => 'doctor_zhang', 'doctor_name' => '张伟', 'participants' => '张伟,陈静', 'status' => 'scheduled', 'planned_at' => $at(15, 0), 'started_at' => null, 'finished_at' => null, 'summary' => '', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('ward_round_notes')->insert([
            ['id' => 1, 'note_no' => "WN-{$ymd}-001", 'round_id' => "WR-{$ymd}-001", 'patient_id' => $p3, 'kind' => '查房意见', 'content' => '维持目前治疗，密切监测意识及瞳孔变化。', 'actor_id' => 'doctor_wang', 'actor_name' => '王建国', 'noted_at' => $at(8, 15), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'note_no' => "WN-{$ymd}-002", 'round_id' => "WR-{$ymd}-001", 'patient_id' => $p3, 'kind' => '护理记录', 'content' => '翻身拍背一次，皮肤完好。', 'actor_id' => 'nurse_chen', 'actor_name' => '陈静', 'noted_at' => $at(8, 18), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'note_no' => "WN-{$ymd}-003", 'round_id' => "WR-{$ymd}-002", 'patient_id' => $p1, 'kind' => '查房意见', 'content' => '建议复查血气分析，必要时上调氧浓度。', 'actor_id' => 'doctor_sun', 'actor_name' => '孙丽', 'noted_at' => $at(11, 15), 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 五大中心
        DB::table('care_centers')->insert([
            ['id' => 1, 'center_id' => 'STROKE', 'name' => '卒中中心', 'lead_dept' => 'NEURO', 'related_depts' => json_encode(['NEURO', 'ICU', 'EMERGENCY'], JSON_UNESCAPED_UNICODE), 'status' => 'active', 'sort' => 10, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'center_id' => 'CHEST', 'name' => '胸痛中心', 'lead_dept' => 'CARDIO', 'related_depts' => json_encode(['CARDIO', 'ICU', 'EMERGENCY'], JSON_UNESCAPED_UNICODE), 'status' => 'active', 'sort' => 20, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'center_id' => 'TRAUMA', 'name' => '创伤中心', 'lead_dept' => 'SURGERY', 'related_depts' => json_encode(['SURGERY', 'ICU', 'EMERGENCY'], JSON_UNESCAPED_UNICODE), 'status' => 'active', 'sort' => 30, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'center_id' => 'MATERNAL', 'name' => '危重孕产妇救治中心', 'lead_dept' => 'EMERGENCY', 'related_depts' => json_encode(['EMERGENCY', 'ICU', 'GEN'], JSON_UNESCAPED_UNICODE), 'status' => 'active', 'sort' => 40, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'center_id' => 'PEDIATRIC', 'name' => '危重新生儿救治中心', 'lead_dept' => 'EMERGENCY', 'related_depts' => json_encode(['EMERGENCY', 'ICU'], JSON_UNESCAPED_UNICODE), 'status' => 'inactive', 'sort' => 50, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 中心能力画像：center_id + org_id 唯一
        $profileBase = ['visible_patients' => 128, 'pending_transfer' => 4, 'team_size' => 24, 'annual_volume' => 860, 'pathway_rate' => 0.9200, 'assessment_note' => '已通过省级中心认证'];
        DB::table('care_center_profiles')->insert([
            array_merge($profileBase, ['id' => 1, 'center_id' => 'STROKE', 'org_id' => 'WY001', 'equipment' => json_encode(['CT', 'DSA', '溶栓药物'], JSON_UNESCAPED_UNICODE), 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
            array_merge($profileBase, ['id' => 2, 'center_id' => 'CHEST', 'org_id' => 'WY001', 'equipment' => json_encode(['DSA', '除颤仪', '心电监护'], JSON_UNESCAPED_UNICODE), 'visible_patients' => 96, 'annual_volume' => 640, 'pathway_rate' => 0.8800, 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
            array_merge($profileBase, ['id' => 3, 'center_id' => 'TRAUMA', 'org_id' => 'WY001', 'equipment' => json_encode(['手术室', '输血科'], JSON_UNESCAPED_UNICODE), 'visible_patients' => 54, 'annual_volume' => 320, 'pathway_rate' => 0.8500, 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
            array_merge($profileBase, ['id' => 4, 'center_id' => 'MATERNAL', 'org_id' => 'WY001', 'equipment' => json_encode(['产房', '新生儿暖箱'], JSON_UNESCAPED_UNICODE), 'visible_patients' => 40, 'annual_volume' => 210, 'pathway_rate' => 0.9000, 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
            array_merge($profileBase, ['id' => 5, 'center_id' => 'STROKE', 'org_id' => 'HX001', 'equipment' => json_encode(['杂交手术室', 'DSA', 'NICU'], JSON_UNESCAPED_UNICODE), 'visible_patients' => 260, 'pending_transfer' => 12, 'team_size' => 68, 'annual_volume' => 2400, 'pathway_rate' => 0.9600, 'assessment_note' => '国家高级卒中中心', 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
            array_merge($profileBase, ['id' => 6, 'center_id' => 'CHEST', 'org_id' => 'HX001', 'equipment' => json_encode(['杂交手术室', 'ECMO', 'DSA'], JSON_UNESCAPED_UNICODE), 'visible_patients' => 210, 'pending_transfer' => 9, 'team_size' => 52, 'annual_volume' => 1800, 'pathway_rate' => 0.9500, 'assessment_note' => '国家胸痛中心', 'profiled_at' => $at(8, 0), 'created_at' => $now, 'updated_at' => $now]),
        ]);
    }
}
