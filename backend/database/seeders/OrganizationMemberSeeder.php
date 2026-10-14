<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 机构成员（公开医护资料 / 本科室人员）
 * 关联 organizations.org_code 与 departments.dept_code
 */
class OrganizationMemberSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('organization_members')->insert([
            ['member_id' => 'WY001-lai-jun', 'org_code' => 'WY001', 'name' => '赖军', 'title' => '主任医师', 'profession' => '医师', 'dept_id' => 'ICU', 'work_areas' => json_encode(['reception', 'ward']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
            ['member_id' => 'WY001-hu-xuefeng', 'org_code' => 'WY001', 'name' => '胡雪峰', 'title' => '副主任医师', 'profession' => '医师', 'dept_id' => 'RESP', 'work_areas' => json_encode(['reception', 'ward']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
            ['member_id' => 'WY001-chen-jing', 'org_code' => 'WY001', 'name' => '陈静', 'title' => '主管护师', 'profession' => '护理', 'dept_id' => 'EMERGENCY', 'work_areas' => json_encode(['reception']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
            ['member_id' => 'WY001-zhou-ying', 'org_code' => 'WY001', 'name' => '周颖', 'title' => '主治医师', 'profession' => '医师', 'dept_id' => 'NEURO', 'work_areas' => json_encode(['reception', 'ward']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
            ['member_id' => 'HX001-liu-min', 'org_code' => 'HX001', 'name' => '刘敏', 'title' => '主任医师', 'profession' => '医师', 'dept_id' => 'NEURO', 'work_areas' => json_encode(['reception', 'ward']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
            ['member_id' => 'LJ001-li-ming', 'org_code' => 'LJ001', 'name' => '李明', 'title' => '主治医师', 'profession' => '医师', 'dept_id' => 'EMERGENCY', 'work_areas' => json_encode(['field']), 'evidence_as_of' => '', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
