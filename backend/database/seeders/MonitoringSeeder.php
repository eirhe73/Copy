<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 远程监控流台账
 *
 * kind：icu / bed / vehicle；online 决定详情拉流是否可用
 */
class MonitoringSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('monitoring_streams')->insert([
            [
                'id' => 1, 'stream_id' => 'CAM-ICU-01', 'name' => '重症医学科 1 床监护画面', 'kind' => 'icu',
                'institution_id' => 'WY001', 'department_id' => 'ICU', 'bed_id' => 'WY001-ICU-01', 'bed_label' => 'ICU-01',
                'vehicle_id' => null, 'online' => 1, 'ptz_enabled' => 1, 'protocol' => 'webrtc',
                'stream_url' => 'rtsp://demo.local/live/icu-01', 'fallback_url' => 'http://demo.local/live/icu-01.flv',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'stream_id' => 'CAM-ICU-02', 'name' => '重症医学科 2 床监护画面', 'kind' => 'icu',
                'institution_id' => 'WY001', 'department_id' => 'ICU', 'bed_id' => 'WY001-ICU-02', 'bed_label' => 'ICU-02',
                'vehicle_id' => null, 'online' => 1, 'ptz_enabled' => 0, 'protocol' => 'flv',
                'stream_url' => 'rtsp://demo.local/live/icu-02', 'fallback_url' => 'http://demo.local/live/icu-02.flv',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'stream_id' => 'CAM-EMG-05', 'name' => '急诊科 5 床监护画面', 'kind' => 'bed',
                'institution_id' => 'WY001', 'department_id' => 'EMERGENCY', 'bed_id' => 'WY001-EMERGENCY-05', 'bed_label' => '急诊-05',
                'vehicle_id' => null, 'online' => 0, 'ptz_enabled' => 0, 'protocol' => 'hls',
                'stream_url' => 'rtsp://demo.local/live/emg-05', 'fallback_url' => 'http://demo.local/live/emg-05.m3u8',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'stream_id' => 'CAM-AMB-1', 'name' => '救护车 AMB-1 车载画面', 'kind' => 'vehicle',
                'institution_id' => 'WY001', 'department_id' => 'EMERGENCY', 'bed_id' => null, 'bed_label' => null,
                'vehicle_id' => 'AMB-1', 'online' => 1, 'ptz_enabled' => 0, 'protocol' => 'webrtc',
                'stream_url' => 'rtsp://demo.local/live/amb-1', 'fallback_url' => 'http://demo.local/live/amb-1.flv',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'stream_id' => 'CAM-HX-ICU-01', 'name' => '华西重症医学科 1 床画面', 'kind' => 'icu',
                'institution_id' => 'HX001', 'department_id' => 'ICU', 'bed_id' => 'HX001-ICU-01', 'bed_label' => 'ICU-01',
                'vehicle_id' => null, 'online' => 0, 'ptz_enabled' => 1, 'protocol' => 'webrtc',
                'stream_url' => 'rtsp://demo.local/live/hx-icu-01', 'fallback_url' => 'http://demo.local/live/hx-icu-01.flv',
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
