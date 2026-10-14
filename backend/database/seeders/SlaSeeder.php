<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 环节时限台账（SLA）
 *
 * rule_id：SLA-ALERT（预警后到床，10 分钟）/ SLA-DISPATCH（出警后到院，30 分钟）
 */
class SlaSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        DB::table('sla_records')->insert([
            [
                'id' => 1, 'sla_code' => "SLA-{$ymd}-001", 'kind' => '预警到床', 'rule_id' => 'SLA-ALERT',
                'subject' => '王秀兰 · 心内科 12床', 'owner' => '张伟', 'role_view' => 'doctor',
                'started_at' => $at(8, 20), 'arrived_at' => $at(8, 26), 'limit_minutes' => 10,
                'used_minutes' => 6, 'overtime' => 0, 'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'sla_code' => "SLA-{$ymd}-002", 'kind' => '预警到床', 'rule_id' => 'SLA-ALERT',
                'subject' => '赵德海 · 呼吸内科 05床', 'owner' => '王建国', 'role_view' => 'doctor',
                'started_at' => $at(12, 25), 'arrived_at' => null, 'limit_minutes' => 10,
                'used_minutes' => 18, 'overtime' => 1, 'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'sla_code' => "SLA-{$ymd}-003", 'kind' => '出警到院', 'rule_id' => 'SLA-DISPATCH',
                'subject' => 'AMB-1 · 120-'.now()->format('Ymd').'-01', 'owner' => '赵强', 'role_view' => 'director',
                'started_at' => $at(8, 16), 'arrived_at' => $at(8, 40), 'limit_minutes' => 30,
                'used_minutes' => 24, 'overtime' => 0, 'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'sla_code' => "SLA-{$ymd}-004", 'kind' => '出警到院', 'rule_id' => 'SLA-DISPATCH',
                'subject' => 'AMB-6 · 120-'.now()->format('Ymd').'-05', 'owner' => '赵强', 'role_view' => 'director',
                'started_at' => $at(11, 10), 'arrived_at' => null, 'limit_minutes' => 30,
                'used_minutes' => 36, 'overtime' => 1, 'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'sla_code' => "SLA-{$ymd}-005", 'kind' => '预警到床', 'rule_id' => 'SLA-ALERT',
                'subject' => '孙志强 · 心内科 06床', 'owner' => '张伟', 'role_view' => 'doctor',
                'started_at' => $at(7, 45), 'arrived_at' => $at(7, 53), 'limit_minutes' => 10,
                'used_minutes' => 8, 'overtime' => 0, 'is_deleted' => 0, 'deleted_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
