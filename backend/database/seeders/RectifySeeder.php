<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 质控整改单（qc_rectifies）+ 流转日志（qc_rectify_logs）
 */
class RectifySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('qc_rectifies')->insert([
            [
                'rectify_id' => 'ZG02600001', 'title' => '卒中患者 DNT 中位时间超出目标值',
                'description' => '近一个月卒中绿色通道 DNT 中位时间超过 45 分钟目标值。',
                'source' => 'alert', 'level' => 1, 'status' => 'closed',
                'owner_name' => '周颖', 'owner_org' => 'WY001', 'owner_dept' => 'NEURO',
                'standard_id' => null, 'rule_id' => null,
                'found_at' => '2026-10-01 09:00:00', 'deadline' => '2026-10-15 09:00:00', 'closed_at' => '2026-10-08 16:20:00',
                'standard_gap' => '目标 DNT 中位时间 ≤45 分钟，实际统计为 58 分钟。',
                'cause_category' => '流程制度', 'cause_analysis' => 'CT 室未设卒中患者优先检查规则。',
                'measure' => '修订卒中绿色通道流程，CT 室设立卒中优先位。',
                'reviewer_name' => '王慧敏', 'role_view' => 'director',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'rectify_id' => 'ZG02600002', 'title' => '急诊科设备巡检发现监护仪报警阈值漂移',
                'description' => '例行巡检发现两台监护仪心率上限报警阈值漂移。',
                'source' => 'inspection', 'level' => 2, 'status' => 'rectifying',
                'owner_name' => '陈静', 'owner_org' => 'WY001', 'owner_dept' => 'EMERGENCY',
                'standard_id' => null, 'rule_id' => null,
                'found_at' => '2026-10-10 10:00:00', 'deadline' => '2026-10-20 10:00:00', 'closed_at' => null,
                'standard_gap' => '设备参数未按期标定。',
                'cause_category' => '设备设施', 'cause_analysis' => '设备科巡检周期未覆盖报警阈值标定项。',
                'measure' => '补充标定项并纳入月度巡检清单。',
                'reviewer_name' => '', 'role_view' => 'doctor',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'rectify_id' => 'ZG02600003', 'title' => '胸痛中心启动响应超时',
                'description' => '胸痛中心启动响应时长超出绿色通道时限。',
                'source' => 'pathwayTimeout', 'level' => 1, 'status' => 'pending',
                'owner_name' => '王建国', 'owner_org' => 'WY001', 'owner_dept' => 'CARDIO',
                'standard_id' => null, 'rule_id' => null,
                'found_at' => '2026-10-12 08:30:00', 'deadline' => '2026-10-22 08:30:00', 'closed_at' => null,
                'standard_gap' => '启动响应目标 ≤10 分钟，实际 14 分钟。',
                'cause_category' => '', 'cause_analysis' => null, 'measure' => null,
                'reviewer_name' => '', 'role_view' => 'doctor',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('qc_rectify_logs')->insert([
            ['rectify_id' => 'ZG02600001', 'action' => 'start', 'operator' => '周颖', 'remark' => '已联合影像科修订优先检查规则。', 'at' => '2026-10-02 10:30:00', 'created_at' => $now, 'updated_at' => $now],
            ['rectify_id' => 'ZG02600001', 'action' => 'submit', 'operator' => '周颖', 'remark' => '演练 DNT 中位时间 42 分钟，申请复评。', 'at' => '2026-10-05 10:30:00', 'created_at' => $now, 'updated_at' => $now],
            ['rectify_id' => 'ZG02600001', 'action' => 'approve', 'operator' => '王慧敏', 'remark' => '连续两周 DNT 43/41 分钟，达标，同意销号。', 'at' => '2026-10-08 16:20:00', 'created_at' => $now, 'updated_at' => $now],
            ['rectify_id' => 'ZG02600002', 'action' => 'start', 'operator' => '陈静', 'remark' => '已通知设备科重新标定。', 'at' => '2026-10-11 09:00:00', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
