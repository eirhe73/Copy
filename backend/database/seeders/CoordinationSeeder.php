<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 移动端与会诊：协同待办 / 协同任务 / 手机重症接收单
 * 关联 users.username、organizations.org_code、departments.dept_code
 */
class CoordinationSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('coordination_todos')->insert([
            [
                'todo_id' => 'req-CR-F-002', 'assignee_id' => 'doctor_wang', 'title' => '王秀兰 · 等待接收方确认担保床位',
                'hint' => '卒中绿色通道已启动，请接收科室确认后现场转运', 'tone' => 'danger', 'kind' => 'transfer_confirm',
                'patient_id' => 'FIELD-002', 'patient_name' => '王秀兰', 'journey_id' => 'J-FIELD-002', 'token' => 'xun-2026-0002',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'EMERGENCY',
                'priority' => 'P0', 'status' => 'open', 'at' => '2026-10-12 13:42:06', 'due_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'todo_id' => 'identity-FIELD-006', 'assignee_id' => 'doctor_li', 'title' => '身份待核实患者 · 请短信补充身份信息',
                'hint' => '患者身份待核实，请通过短信链路补全', 'tone' => 'warn', 'kind' => 'identity',
                'patient_id' => 'FIELD-006', 'patient_name' => '身份待核实患者', 'journey_id' => 'J-FIELD-006', 'token' => null,
                'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'EMERGENCY',
                'priority' => 'P1', 'status' => 'open', 'at' => '2026-10-12 14:52:06', 'due_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'todo_id' => 'consult-CR-003', 'assignee_id' => 'doctor_liu', 'title' => '远程会诊待领取 · 胸痛患者',
                'hint' => '基层上报胸痛患者，等待会诊医生领取', 'tone' => 'warn', 'kind' => 'consult_dispatch',
                'patient_id' => 'FIELD-003', 'patient_name' => '演示患者03', 'journey_id' => 'J-FIELD-003', 'token' => 'xun-2026-0003',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'GEN',
                'target_institution_id' => 'HX001', 'target_department_id' => 'CARDIO',
                'priority' => 'P0', 'status' => 'open', 'at' => '2026-10-12 11:00:00', 'due_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('coordination_tasks')->insert([
            [
                'task_id' => 'T-DISP-0001', 'title' => '转运任务 · 李建国（连界镇 → 威远县人民医院）',
                'kind' => 'transport', 'patient_id' => 'FIELD-001', 'patient_name' => '李建国',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'target_institution_id' => 'WY001', 'target_department_id' => 'EMERGENCY',
                'assignee_id' => 'ambulance_team', 'assignee_name' => '突击队一号', 'vehicle_id' => 'AMB-1',
                'status' => 'doing',
                'milestones' => json_encode([
                    ['key' => 'accepted', 'label' => '已受理', 'at' => '2026-10-12T12:07:06+08:00', 'by' => 'ambulance_team'],
                    ['key' => 'on-scene', 'label' => '到达现场', 'at' => '2026-10-12T12:15:06+08:00', 'by' => 'ambulance_team'],
                ]),
                'started_at' => '2026-10-12 12:06:06', 'due_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'task_id' => 'T-CONSULT-0002', 'title' => '远程会诊 · 演示患者03',
                'kind' => 'consult', 'patient_id' => 'FIELD-003', 'patient_name' => '演示患者03',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'GEN',
                'target_institution_id' => 'HX001', 'target_department_id' => 'CARDIO',
                'assignee_id' => 'doctor_liu', 'assignee_name' => '刘敏', 'vehicle_id' => '',
                'status' => 'todo', 'milestones' => null, 'started_at' => null, 'due_at' => null,
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        DB::table('mobile_receptions')->insert([
            [
                'reception_id' => 'MR-20261012-002', 'token' => 'xun-2026-0002', 'journey_id' => 'J-FIELD-002',
                'patient_id' => 'FIELD-002', 'patient_name' => '王秀兰', 'gender' => 'FEMALE', 'age' => 71, 'phone' => '138****0202',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'category' => '卒中', 'complaint' => '突发言语不清伴右侧肢体无力 1 小时',
                'symptoms' => json_encode(['面部不对称', '单侧肢体无力', '言语不清']),
                'accepted_institution_id' => null, 'accepted_department_id' => null, 'accepted_by' => '',
                'status' => 'pending',
                'prep_checklist' => json_encode([
                    ['key' => 'bed', 'title' => '预留床位', 'done' => false, 'note' => ''],
                    ['key' => 'respiratory', 'title' => '呼吸支持设备', 'done' => false, 'note' => ''],
                    ['key' => 'imaging', 'title' => 'CT 检查绿色通道', 'done' => false, 'note' => ''],
                ]),
                'accepted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'reception_id' => 'MR-20261012-001', 'token' => 'xun-2026-0001', 'journey_id' => 'J-FIELD-001',
                'patient_id' => 'FIELD-001', 'patient_name' => '李建国', 'gender' => 'MALE', 'age' => 63, 'phone' => '139****0101',
                'source_institution_id' => 'LJ001', 'source_department_id' => 'EMERGENCY',
                'category' => '胸痛', 'complaint' => '胸痛、出汗 40 分钟',
                'symptoms' => json_encode(['胸痛（非创伤）', '呼吸困难']),
                'accepted_institution_id' => 'WY001', 'accepted_department_id' => 'EMERGENCY', 'accepted_by' => 'doctor_wang',
                'status' => 'accepted',
                'prep_checklist' => json_encode([
                    ['key' => 'bed', 'title' => '预留床位', 'done' => true, 'note' => '急诊 3 床'],
                ]),
                'accepted_at' => '2026-10-12 12:30:00', 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
