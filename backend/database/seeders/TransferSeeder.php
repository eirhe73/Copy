<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 转运任务 / 转运里程碑 / 车辆定位 / 车辆轨迹 / 到院交接
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
                'id' => 1, 'transfer_code' => "TR-{$ymd}-001", 'event_id' => 1, 'patient_id' => 1,
                'from_org_id' => 3, 'to_org_id' => 2, 'urgency_level' => 'URGENCY_HIGH',
                'transfer_reason' => '急性胸痛需 PCI 介入治疗，基层无能力',
                'diagnosis' => '急性冠脉综合征', 'trigger_source' => 'SOURCE_120',
                'transfer_status' => 'TRANSPORTING', 'confirm_status' => 'CONFIRM_CONFIRMED',
                'confirmed_at' => $at(8, 20), 'confirmed_by_user_id' => 4, 'reject_reason' => null,
                'review_note' => '已开通胸痛绿色通道', 'vehicle_id' => 1, 'driver_name' => '周师傅',
                'eta' => $at(8, 40), 'latest_vitals' => json_encode(['hr' => 118, 'sbp' => 92, 'spo2' => 91], JSON_UNESCAPED_UNICODE),
                'resource_prep' => json_encode(['导管室', '心内科值班'], JSON_UNESCAPED_UNICODE),
                'handover_status' => '待交接', 'initiator_user_id' => 7,
                'from_institution_id' => 'LJ001', 'to_institution_id' => 'WY001',
                'doctor_id' => 'doctor_wang', 'nurse_id' => 'nurse_chen',
                'started_at' => $at(8, 25), 'arrived_at' => null, 'handover_at' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(60), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'transfer_code' => "TR-{$ymd}-002", 'event_id' => 6, 'patient_id' => 6,
                'from_org_id' => 4, 'to_org_id' => 2, 'urgency_level' => 'URGENCY_MEDIUM',
                'transfer_reason' => '呼吸衰竭需上级医院无创通气支持',
                'diagnosis' => '慢性阻塞性肺疾病急性加重', 'trigger_source' => 'SOURCE_120',
                'transfer_status' => 'TRANSFER_CONFIRMED', 'confirm_status' => 'CONFIRM_CONFIRMED',
                'confirmed_at' => $at(12, 30), 'confirmed_by_user_id' => 4, 'reject_reason' => null,
                'review_note' => '预留呼吸内科床位', 'vehicle_id' => 2, 'driver_name' => '吴师傅',
                'eta' => $at(13, 0), 'latest_vitals' => json_encode(['hr' => 108, 'sbp' => 102, 'spo2' => 89], JSON_UNESCAPED_UNICODE),
                'resource_prep' => json_encode(['无创呼吸机'], JSON_UNESCAPED_UNICODE),
                'handover_status' => null, 'initiator_user_id' => 5,
                'from_institution_id' => 'XC001', 'to_institution_id' => 'WY001',
                'doctor_id' => 'doctor_li', 'nurse_id' => 'nurse_chen',
                'started_at' => $at(12, 45), 'arrived_at' => null, 'handover_at' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(35), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'transfer_code' => "TR-{$ymd}-003", 'event_id' => 2, 'patient_id' => 2,
                'from_org_id' => 3, 'to_org_id' => 2, 'urgency_level' => 'URGENCY_HIGH',
                'transfer_reason' => '疑似急性脑卒中，需溶栓评估',
                'diagnosis' => '急性脑血管病', 'trigger_source' => 'SOURCE_120',
                'transfer_status' => 'TRANSFER_PENDING', 'confirm_status' => 'CONFIRM_PENDING',
                'confirmed_at' => null, 'confirmed_by_user_id' => null, 'reject_reason' => null,
                'review_note' => null, 'vehicle_id' => null, 'driver_name' => null,
                'eta' => $at(10, 0), 'latest_vitals' => json_encode(['hr' => 96, 'sbp' => 186, 'spo2' => 94], JSON_UNESCAPED_UNICODE),
                'resource_prep' => null, 'handover_status' => null, 'initiator_user_id' => 7,
                'from_institution_id' => 'LJ001', 'to_institution_id' => 'WY001',
                'doctor_id' => 'doctor_li', 'nurse_id' => null,
                'started_at' => null, 'arrived_at' => null, 'handover_at' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(25), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'transfer_code' => "TR-{$ymd}-004", 'event_id' => 4, 'patient_id' => 3,
                'from_org_id' => 2, 'to_org_id' => 1, 'urgency_level' => 'URGENCY_MEDIUM',
                'transfer_reason' => '脑梗死超窗需上级医院血管内治疗',
                'diagnosis' => '脑梗死', 'trigger_source' => 'MANUAL',
                'transfer_status' => 'HANDOVER', 'confirm_status' => 'CONFIRM_CONFIRMED',
                'confirmed_at' => $at(8, 30), 'confirmed_by_user_id' => 3, 'reject_reason' => null,
                'review_note' => '已安排神经内科接诊', 'vehicle_id' => 4, 'driver_name' => '冯师傅',
                'eta' => $at(9, 30), 'latest_vitals' => json_encode(['hr' => 88, 'sbp' => 150, 'spo2' => 95], JSON_UNESCAPED_UNICODE),
                'resource_prep' => json_encode(['介入手术室'], JSON_UNESCAPED_UNICODE),
                'handover_status' => '已交接', 'initiator_user_id' => 2,
                'from_institution_id' => 'WY001', 'to_institution_id' => 'HX001',
                'doctor_id' => 'doctor_wang', 'nurse_id' => 'nurse_chen',
                'started_at' => $at(8, 40), 'arrived_at' => $at(9, 25), 'handover_at' => $at(9, 35),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subMinutes(100), 'updated_at' => $now,
            ],
        ]);

        DB::table('transfer_milestones')->insert([
            ['id' => 1, 'transfer_no' => "TR-{$ymd}-001", 'milestone_key' => 'accepted', 'milestone_label' => '已受理', 'occurred_at' => $at(8, 18), 'actor' => '赵强', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'transfer_no' => "TR-{$ymd}-001", 'milestone_key' => 'on-scene', 'milestone_label' => '到达现场', 'occurred_at' => $at(8, 25), 'actor' => '王建国', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'transfer_no' => "TR-{$ymd}-001", 'milestone_key' => 'onboard', 'milestone_label' => '患者上车', 'occurred_at' => $at(8, 32), 'actor' => '陈静', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'transfer_no' => "TR-{$ymd}-002", 'milestone_key' => 'accepted', 'milestone_label' => '已受理', 'occurred_at' => $at(12, 30), 'actor' => '张伟', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'transfer_no' => "TR-{$ymd}-002", 'milestone_key' => 'on-scene', 'milestone_label' => '到达现场', 'occurred_at' => $at(12, 45), 'actor' => '何医生', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'transfer_no' => "TR-{$ymd}-004", 'milestone_key' => 'arrived', 'milestone_label' => '到达医院', 'occurred_at' => $at(9, 25), 'actor' => '冯师傅', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'transfer_no' => "TR-{$ymd}-004", 'milestone_key' => 'handover', 'milestone_label' => '完成交接', 'occurred_at' => $at(9, 35), 'actor' => '刘敏', 'created_at' => $now, 'updated_at' => $now],
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
                'id' => 1, 'handover_no' => "HO-{$ymd}-001", 'transfer_no' => "TR-{$ymd}-004", 'event_id' => "EVT-{$ymd}-04",
                'task120_id' => "120-{$ymd}-04", 'patient_id' => 'PAT-'.now()->format('Ymd').'-003', 'patient_name' => '张桂英',
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
                'id' => 2, 'handover_no' => "HO-{$ymd}-002", 'transfer_no' => "TR-{$ymd}-001", 'event_id' => "EVT-{$ymd}-01",
                'task120_id' => "120-{$ymd}-01", 'patient_id' => 'PAT-'.now()->format('Ymd').'-001', 'patient_name' => '王秀兰',
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
