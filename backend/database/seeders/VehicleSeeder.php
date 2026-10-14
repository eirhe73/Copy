<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 救护车台账数据
 *
 * status：0待命 1出警中 2现场处置 3返院途中
 * vehicle_status 与 status 同步（语义化枚举）
 */
class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');

        DB::table('vehicles')->insert([
            [
                'id' => 1, 'vehicle_id' => 'AMB-1', 'plate_number' => '川K1201', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 2, 'vehicle_status' => 'VEHICLE_DISPATCHING', 'status' => 1,
                'bound_hospital' => '威远县人民医院', 'crew' => '王建国 / 陈静',
                'current_event_id' => "EVT-{$ymd}-01", 'driver_name' => '周师傅', 'driver_phone' => '13900000001',
                'latest_lng' => 104.652000, 'latest_lat' => 29.531000, 'latest_at' => now()->subMinutes(3),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'vehicle_id' => 'AMB-2', 'plate_number' => '川K1202', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 2, 'vehicle_status' => 'VEHICLE_ON_SCENE', 'status' => 2,
                'bound_hospital' => '威远县人民医院', 'crew' => '张伟 / 李娜',
                'current_event_id' => "EVT-{$ymd}-02", 'driver_name' => '吴师傅', 'driver_phone' => '13900000002',
                'latest_lng' => 104.610000, 'latest_lat' => 29.550000, 'latest_at' => now()->subMinutes(8),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'vehicle_id' => 'AMB-3', 'plate_number' => '川K1203', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 3, 'vehicle_status' => 'VEHICLE_STANDBY', 'status' => 0,
                'bound_hospital' => '连界镇中心卫生院', 'crew' => '李明 / 王芳',
                'current_event_id' => null, 'driver_name' => '郑师傅', 'driver_phone' => '13900000003',
                'latest_lng' => 104.540000, 'latest_lat' => 29.640000, 'latest_at' => now()->subMinutes(30),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'vehicle_id' => 'AMB-4', 'plate_number' => '川K1204', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 4, 'vehicle_status' => 'VEHICLE_RETURNING', 'status' => 3,
                'bound_hospital' => '新场镇卫生院', 'crew' => '何医生 / 杨护士',
                'current_event_id' => "EVT-{$ymd}-04", 'driver_name' => '冯师傅', 'driver_phone' => '13900000004',
                'latest_lng' => 104.592000, 'latest_lat' => 29.566000, 'latest_at' => now()->subMinutes(5),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'vehicle_id' => 'AMB-5', 'plate_number' => '川K1205', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 1, 'vehicle_status' => 'VEHICLE_STANDBY', 'status' => 0,
                'bound_hospital' => '四川大学华西医院', 'crew' => '刘敏 / 赵敏',
                'current_event_id' => null, 'driver_name' => '许师傅', 'driver_phone' => '13900000005',
                'latest_lng' => 104.064000, 'latest_lat' => 30.659000, 'latest_at' => now()->subMinutes(20),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 6, 'vehicle_id' => 'AMB-6', 'plate_number' => '川K1206', 'vehicle_type' => 'AMBULANCE',
                'org_id' => 6, 'vehicle_status' => 'VEHICLE_DISPATCHING', 'status' => 1,
                'bound_hospital' => '内江市第一人民医院', 'crew' => '孙丽 / 罗护士',
                'current_event_id' => "EVT-{$ymd}-05", 'driver_name' => '邓师傅', 'driver_phone' => '13900000006',
                'latest_lng' => 105.055000, 'latest_lat' => 29.590000, 'latest_at' => now()->subMinutes(6),
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
