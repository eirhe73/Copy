<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 医疗质量：质控标准 / 质控问题整改台账
 *
 * severity：SEVERITY_LOW/MEDIUM/HIGH；qc_status：QC_OPEN/QC_RECTIFYING/QC_CLOSED
 */
class QualitySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $ymd = now()->format('Ymd');
        $day = now()->copy()->startOfDay();
        $at = fn (int $hour, int $minute) => $day->copy()->addHours($hour)->addMinutes($minute);

        DB::table('qc_standards')->insert([
            ['id' => 1, 'version' => '2026-Q4', 'standard_name' => '院前急救响应时限达标率', 'category' => '响应时效', 'target_rate' => 0.9500, 'sort' => 10, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'version' => '2026-Q4', 'standard_name' => '危重患者转运交接完整率', 'category' => '转运交接', 'target_rate' => 0.9800, 'sort' => 20, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'version' => '2026-Q4', 'standard_name' => '预警五分钟内确认率', 'category' => '预警处置', 'target_rate' => 0.9000, 'sort' => 30, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'version' => '2026-Q4', 'standard_name' => '病历书写规范率', 'category' => '病历质量', 'target_rate' => 0.9500, 'sort' => 40, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'version' => '2026-Q3', 'standard_name' => '急救设备完好率', 'category' => '设备管理', 'target_rate' => 0.9900, 'sort' => 50, 'is_active' => 0, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('qc_issues')->insert([
            [
                'id' => 1, 'qc_code' => "QC-{$ymd}-001", 'issue_title' => '急救车出警响应超时', 'severity' => 'SEVERITY_HIGH',
                'issue_source' => '系统监测', 'owner_user_id' => 6, 'current_stage' => '整改中',
                'qc_status' => 'QC_RECTIFYING', 'state_version' => 2, 'due_at' => $at(18, 0),
                'related_type' => 'QC_STANDARD', 'related_id' => 1, 'supervise_target' => '连界镇中心卫生院',
                'check_method' => '系统抽查', 'check_item' => '出警响应时间是否小于5分钟', 'check_result' => '平均响应6.2分钟',
                'discovered_at' => now()->subDay()->toDateString(), 'is_on_time_completed' => null, 'event_id' => 1,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subDays(2), 'updated_at' => $now,
            ],
            [
                'id' => 2, 'qc_code' => "QC-{$ymd}-002", 'issue_title' => '预警未在5分钟内确认', 'severity' => 'SEVERITY_MEDIUM',
                'issue_source' => '预警统计', 'owner_user_id' => 5, 'current_stage' => '已闭环',
                'qc_status' => 'QC_CLOSED', 'state_version' => 3, 'due_at' => now()->subDay(),
                'related_type' => 'QC_STANDARD', 'related_id' => 3, 'supervise_target' => '威远县人民医院',
                'check_method' => '系统抽查', 'check_item' => '预警确认时效', 'check_result' => '达标',
                'discovered_at' => now()->subDays(3)->toDateString(), 'is_on_time_completed' => 1, 'event_id' => 2,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subDays(4), 'updated_at' => $now,
            ],
            [
                'id' => 3, 'qc_code' => "QC-{$ymd}-003", 'issue_title' => '转运交接单缺项', 'severity' => 'SEVERITY_MEDIUM',
                'issue_source' => '病历抽查', 'owner_user_id' => 2, 'current_stage' => '待整改',
                'qc_status' => 'QC_OPEN', 'state_version' => 1, 'due_at' => $at(20, 0),
                'related_type' => 'QC_STANDARD', 'related_id' => 2, 'supervise_target' => '威远县人民医院',
                'check_method' => '病历抽查', 'check_item' => '交接单必填项完整性', 'check_result' => '缺少影像资料签收',
                'discovered_at' => now()->toDateString(), 'is_on_time_completed' => null, 'event_id' => 4,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subHours(6), 'updated_at' => $now,
            ],
            [
                'id' => 4, 'qc_code' => "QC-{$ymd}-004", 'issue_title' => '病历主诉与现病史不一致', 'severity' => 'SEVERITY_LOW',
                'issue_source' => '病历抽查', 'owner_user_id' => 4, 'current_stage' => '已闭环',
                'qc_status' => 'QC_CLOSED', 'state_version' => 2, 'due_at' => now()->subHours(2),
                'related_type' => null, 'related_id' => null, 'supervise_target' => '威远县人民医院',
                'check_method' => '病历抽查', 'check_item' => '主诉与现病史一致性', 'check_result' => '达标',
                'discovered_at' => now()->subDays(1)->toDateString(), 'is_on_time_completed' => 1, 'event_id' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subDays(1), 'updated_at' => $now,
            ],
            [
                'id' => 5, 'qc_code' => "QC-{$ymd}-005", 'issue_title' => '基层急救设备巡检遗漏', 'severity' => 'SEVERITY_HIGH',
                'issue_source' => '设备巡检', 'owner_user_id' => 7, 'current_stage' => '待整改',
                'qc_status' => 'QC_OPEN', 'state_version' => 1, 'due_at' => now()->addHours(6),
                'related_type' => 'QC_STANDARD', 'related_id' => 5, 'supervise_target' => '新场镇卫生院',
                'check_method' => '现场核查', 'check_item' => '急救设备巡检记录', 'check_result' => '连续两日未巡检',
                'discovered_at' => now()->toDateString(), 'is_on_time_completed' => null, 'event_id' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subHours(3), 'updated_at' => $now,
            ],
            [
                'id' => 6, 'qc_code' => "QC-{$ymd}-006", 'issue_title' => '远程会诊意见反馈不及时', 'severity' => 'SEVERITY_LOW',
                'issue_source' => '会诊统计', 'owner_user_id' => 3, 'current_stage' => '整改中',
                'qc_status' => 'QC_RECTIFYING', 'state_version' => 2, 'due_at' => now()->addDays(2),
                'related_type' => null, 'related_id' => null, 'supervise_target' => '四川大学华西医院',
                'check_method' => '系统抽查', 'check_item' => '会诊意见执行反馈率', 'check_result' => '反馈率 82%',
                'discovered_at' => now()->subDays(2)->toDateString(), 'is_on_time_completed' => null, 'event_id' => null,
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now->copy()->subDays(2), 'updated_at' => $now,
            ],
        ]);
    }
}
