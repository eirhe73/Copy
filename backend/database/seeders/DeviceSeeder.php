<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 床旁设备台账与设备巡检
 *
 * result：ok正常 / fault异常
 */
class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        $p1 = 'PAT-'.$ymd.'-001';
        $p3 = 'PAT-'.$ymd.'-003';

        DB::table('medical_devices')->insert([
            [
                'id' => 1, 'device_id' => 'DEV-MON-001', 'name' => '监护仪', 'bed_id' => 'WY001-ICU-01', 'bed_label' => 'ICU-01',
                'patient_id' => $p3, 'patient_name' => '张桂英', 'online' => 1, 'alarm' => 0,
                'bound_at' => $at(8, 30), 'previous_bed_id' => null, 'unbound_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'device_id' => 'DEV-MON-002', 'name' => '监护仪', 'bed_id' => 'WY001-ICU-02', 'bed_label' => 'ICU-02',
                'patient_id' => $p1, 'patient_name' => '王秀兰', 'online' => 1, 'alarm' => 1,
                'bound_at' => $at(8, 35), 'previous_bed_id' => null, 'unbound_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'device_id' => 'DEV-VENT-001', 'name' => '呼吸机', 'bed_id' => 'WY001-ICU-02', 'bed_label' => 'ICU-02',
                'patient_id' => $p1, 'patient_name' => '王秀兰', 'online' => 1, 'alarm' => 0,
                'bound_at' => $at(8, 40), 'previous_bed_id' => null, 'unbound_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'device_id' => 'DEV-PUMP-001', 'name' => '输液泵', 'bed_id' => 'WY001-EMERGENCY-01', 'bed_label' => '急诊-01',
                'patient_id' => $p1, 'patient_name' => '王秀兰', 'online' => 1, 'alarm' => 0,
                'bound_at' => $at(8, 45), 'previous_bed_id' => null, 'unbound_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'device_id' => 'DEV-MON-003', 'name' => '监护仪', 'bed_id' => null, 'bed_label' => null,
                'patient_id' => null, 'patient_name' => null, 'online' => 0, 'alarm' => 0,
                'bound_at' => null, 'previous_bed_id' => 'WY001-ICU-03', 'unbound_at' => $at(7, 30),
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('device_inspections')->insert([
            ['id' => 1, 'inspection_id' => "DI-{$ymd}-001", 'device_id' => 'DEV-MON-001', 'item' => '电源与电池', 'result' => 'ok', 'inspector' => '陈静', 'check_at' => $at(7, 50), 'note' => '电池容量正常', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'inspection_id' => "DI-{$ymd}-002", 'device_id' => 'DEV-MON-002', 'item' => '导联线与电极', 'result' => 'fault', 'inspector' => '陈静', 'check_at' => $at(8, 10), 'note' => 'SpO₂ 探头接触不良，已更换', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'inspection_id' => "DI-{$ymd}-003", 'device_id' => 'DEV-VENT-001', 'item' => '管路气密性', 'result' => 'ok', 'inspector' => '孙丽', 'check_at' => $at(8, 20), 'note' => '', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'inspection_id' => "DI-{$ymd}-004", 'device_id' => 'DEV-PUMP-001', 'item' => '流速校准', 'result' => 'ok', 'inspector' => '陈静', 'check_at' => $at(9, 0), 'note' => '校准通过', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'inspection_id' => "DI-{$ymd}-005", 'device_id' => 'DEV-MON-003', 'item' => '整机功能', 'result' => 'fault', 'inspector' => '孙丽', 'check_at' => $at(7, 30), 'note' => '无法开机，返厂维修', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
