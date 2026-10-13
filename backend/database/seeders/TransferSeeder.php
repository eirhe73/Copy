<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 转运任务 / 转运里程碑 / 车辆定位 / 车辆轨迹 / 到院交接
 *
 * transfers.status：0待接收1已接收2转运中3到院4已完成5已拒绝；direction：0上转1下转。
 */
class TransferSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        DB::table('transfers')->insert([
            [
                'id' => 1, 'transfer_id' => "TRF-{$ymd}-001", 'patient_id' => "PAT-{$ymd}-001", 'patient_name' => '王秀兰',
                'direction' => 0, 'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'CARDIO',
                'status' => 0, 'green_channel' => 1, 'channel_type' => 'chest_pain',
                'reason' => '急性胸痛需 PCI 介入治疗，基层无能力', 'transport_vehicle_id' => null,
                'created_by' => 'doctor_li', 'started_at' => $at(8, 25), 'accepted_at' => null,
                'arrived_at' => null, 'completed_at' => null, 'event_id' => 1,
                'doctor_id' => 'doctor_wang', 'nurse_id' => 'nurse_chen',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(60), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'transfer_id' => "TRF-{$ymd}-002", 'patient_id' => "PAT-{$ymd}-002", 'patient_name' => '李国强',
                'direction' => 0, 'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'RESP',
                'status' => 1, 'green_channel' => 0, 'channel_type' => '',
                'reason' => '呼吸衰竭需上级医院无创通气支持', 'transport_vehicle_id' => 'AMB-2',
                'created_by' => 'doctor_li', 'started_at' => $at(12, 45), 'accepted_at' => $at(12, 50),
                'arrived_at' => null, 'completed_at' => null, 'event_id' => 6,
                'doctor_id' => 'doctor_li', 'nurse_id' => 'nurse_chen',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(35), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'transfer_id' => "TRF-{$ymd}-003", 'patient_id' => "PAT-{$ymd}-003", 'patient_name' => '张桂英',
                'direction' => 0, 'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'NEURO',
                'status' => 2, 'green_channel' => 1, 'channel_type' => 'stroke',
                'reason' => '疑似急性脑卒中，需溶栓评估', 'transport_vehicle_id' => 'AMB-1',
                'created_by' => 'doctor_li', 'started_at' => $at(8, 40), 'accepted_at' => $at(8, 50),
                'arrived_at' => null, 'completed_at' => null, 'event_id' => 2,
                'doctor_id' => 'doctor_li', 'nurse_id' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(25), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'transfer_id' => "TRF-{$ymd}-004", 'patient_id' => "PAT-{$ymd}-003", 'patient_name' => '张桂英',
                'direction' => 0, 'source_institution_id' => 'WY001', 'source_department_id' => 'NEURO',
                'target_institution_id' => 'HX001', 'target_department_id' => 'NEURO',
                'status' => 4, 'green_channel' => 0, 'channel_type' => '',
                'reason' => '脑梗死超窗需上级医院血管内治疗', 'transport_vehicle_id' => 'AMB-4',
                'created_by' => 'doctor_wang', 'started_at' => $at(8, 40), 'accepted_at' => $at(8, 48),
                'arrived_at' => $at(9, 25), 'completed_at' => $at(9, 35), 'event_id' => 4,
                'doctor_id' => 'doctor_wang', 'nurse_id' => 'nurse_chen',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(100), 'updated_at' => $now,
            ],
            [
                'id' => 5, 'transfer_id' => "TRF-{$ymd}-005", 'patient_id' => "PAT-{$ymd}-001", 'patient_name' => '王秀兰',
                'direction' => 1, 'source_institution_id' => 'HX001', 'source_department_id' => 'CARDIO',
                'target_institution_id' => 'WY001', 'target_department_id' => 'CARDIO',
                'status' => 3, 'green_channel' => 0, 'channel_type' => '',
                'reason' => '术后康复下转基层随访', 'transport_vehicle_id' => 'AMB-6',
                'created_by' => 'doctor_wang', 'started_at' => $at(10, 0), 'accepted_at' => $at(10, 10),
                'arrived_at' => $at(10, 50), 'completed_at' => null, 'event_id' => null,
                'doctor_id' => 'doctor_wang', 'nurse_id' => 'nurse_chen',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(80), 'updated_at' => $now,
            ],
            [
                'id' => 6, 'transfer_id' => "TRF-{$ymd}-006", 'patient_id' => "PAT-{$ymd}-002", 'patient_name' => '李国强',
                'direction' => 1, 'source_institution_id' => 'WY001', 'source_department_id' => 'RESP',
                'target_institution_id' => 'LJ001', 'target_department_id' => 'EMERGENCY',
                'status' => 5, 'green_channel' => 0, 'channel_type' => '',
                'reason' => '下级床位与救治能力不足，暂缓接收', 'transport_vehicle_id' => null,
                'created_by' => 'doctor_li', 'started_at' => $at(11, 30), 'accepted_at' => null,
                'arrived_at' => null, 'completed_at' => null, 'event_id' => null,
                'doctor_id' => 'doctor_li', 'nurse_id' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(15), 'updated_at' => $now,
            ],
        ]);

        DB::table('transfer_milestones')->insert([
            ['id' => 1, 'transfer_no' => "TRF-{$ymd}-001", 'milestone_key' => 'accepted', 'milestone_label' => '已受理', 'occurred_at' => $at(8, 18), 'actor' => '赵强', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'transfer_no' => "TRF-{$ymd}-001", 'milestone_key' => 'on-scene', 'milestone_label' => '到达现场', 'occurred_at' => $at(8, 25), 'actor' => '王建国', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'transfer_no' => "TRF-{$ymd}-001", 'milestone_key' => 'onboard', 'milestone_label' => '患者上车', 'occurred_at' => $at(8, 32), 'actor' => '陈静', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'transfer_no' => "TRF-{$ymd}-002", 'milestone_key' => 'accepted', 'milestone_label' => '已受理', 'occurred_at' => $at(12, 30), 'actor' => '张伟', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'transfer_no' => "TRF-{$ymd}-002", 'milestone_key' => 'on-scene', 'milestone_label' => '到达现场', 'occurred_at' => $at(12, 45), 'actor' => '何医生', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'transfer_no' => "TRF-{$ymd}-004", 'milestone_key' => 'arrived', 'milestone_label' => '到达医院', 'occurred_at' => $at(9, 25), 'actor' => '冯师傅', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'transfer_no' => "TRF-{$ymd}-004", 'milestone_key' => 'handover', 'milestone_label' => '完成交接', 'occurred_at' => $at(9, 35), 'actor' => '刘敏', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $routeA = json_encode([[104.668, 29.527], [104.655, 29.531], [104.640, 29.536]], JSON_UNESCAPED_UNICODE);
        $routeB = json_encode([[104.600, 29.560], [104.630, 29.548], [104.668, 29.527]], JSON_UNESCAPED_UNICODE);

        DB::table('vehicle_locations')->insert([
            ['id' => 1, 'vehicle_id' => 'AMB-1', 'lng' => 104.652000, 'lat' => 29.531000, 'speed_kmh' => 46, 'heading' => 210, 'destination' => '威远县人民医院', 'eta_minutes' => 12, 'route' => $routeA, 'located_at' => now()->subMinutes(6), 'updated_at' => now()->subMinutes(6)],
            ['id' => 2, 'vehicle_id' => 'AMB-1', 'lng' => 104.660000, 'lat' => 29.529000, 'speed_kmh' => 52, 'heading' => 205, 'destination' => '威远县人民医院', 'eta_minutes' => 10, 'route' => $routeA, 'located_at' => now()->subMinutes(3), 'updated_at' => now()->subMinutes(3)],
            ['id' => 3, 'vehicle_id' => 'AMB-2', 'lng' => 104.610000, 'lat' => 29.550000, 'speed_kmh' => 0, 'heading' => 90, 'destination' => '威远县人民医院', 'eta_minutes' => 18, 'route' => $routeB, 'located_at' => now()->subMinutes(8), 'updated_at' => now()->subMinutes(8)],
            ['id' => 4, 'vehicle_id' => 'AMB-4', 'lng' => 104.592000, 'lat' => 29.566000, 'speed_kmh' => 58, 'heading' => 150, 'destination' => '威远县人民医院', 'eta_minutes' => 15, 'route' => $routeB, 'located_at' => now()->subMinutes(5), 'updated_at' => now()->subMinutes(5)],
            ['id' => 5, 'vehicle_id' => 'AMB-6', 'lng' => 105.055000, 'lat' => 29.590000, 'speed_kmh' => 48, 'heading' => 300, 'destination' => '内江市第一人民医院', 'eta_minutes' => 20, 'route' => null, 'located_at' => now()->subMinutes(6), 'updated_at' => now()->subMinutes(6)],
        ]);

        DB::table('vehicle_tracks')->insert([
            ['id' => 1, 'vehicle_id' => 1, 'event_id' => 1, 'lng' => 104.668000, 'lat' => 29.527000, 'speed' => 0.00, 'heading' => 0.0, 'recorded_at' => $at(8, 16), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'vehicle_id' => 1, 'event_id' => 1, 'lng' => 104.660000, 'lat' => 29.529000, 'speed' => 42.50, 'heading' => 205.0, 'recorded_at' => $at(8, 24), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'vehicle_id' => 1, 'event_id' => 1, 'lng' => 104.652000, 'lat' => 29.531000, 'speed' => 46.00, 'heading' => 210.0, 'recorded_at' => $at(8, 32), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'vehicle_id' => 2, 'event_id' => 2, 'lng' => 104.640000, 'lat' => 29.536000, 'speed' => 38.00, 'heading' => 230.0, 'recorded_at' => $at(9, 18), 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'vehicle_id' => 4, 'event_id' => 4, 'lng' => 104.592000, 'lat' => 29.566000, 'speed' => 58.00, 'heading' => 150.0, 'recorded_at' => $at(9, 10), 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('handovers')->insert([
            [
                'id' => 1, 'handover_no' => "HO-{$ymd}-001", 'transfer_no' => "TRF-{$ymd}-004", 'event_id' => "EVT-{$ymd}-04",
                'task120_id' => "120-{$ymd}-04", 'patient_id' => "PAT-{$ymd}-003", 'patient_name' => '张桂英',
                'from_staff_id' => 'doctor_wang', 'from_staff_name' => '王建国',
                'to_staff_id' => 'doctor_liu', 'to_staff_name' => '刘敏', 'to_dept' => '神经内科',
                'items' => json_encode([
                    ['name' => '病历资料', 'received' => true],
                    ['name' => '随身药品', 'received' => true],
                    ['name' => '影像胶片', 'received' => false],
                ], JSON_UNESCAPED_UNICODE),
                'signature' => 'SIGNED', 'handover_at' => $at(9, 35), 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'handover_no' => "HO-{$ymd}-002", 'transfer_no' => "TRF-{$ymd}-001", 'event_id' => "EVT-{$ymd}-01",
                'task120_id' => "120-{$ymd}-01", 'patient_id' => "PAT-{$ymd}-001", 'patient_name' => '王秀兰',
                'from_staff_id' => 'doctor_li', 'from_staff_name' => '李明',
                'to_staff_id' => 'doctor_zhang', 'to_staff_name' => '张伟', 'to_dept' => '心血管内科',
                'items' => json_encode([
                    ['name' => '院前记录单', 'received' => true],
                    ['name' => '心电图', 'received' => true],
                ], JSON_UNESCAPED_UNICODE),
                'signature' => '', 'handover_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
