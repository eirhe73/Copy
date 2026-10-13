<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Department;
use App\Models\Organization;

/**
 * 机构名录、科室结构与权限范围
 */
class OrganizationService extends Service
{
    private const LEVEL_LABELS = [
        'center' => '中心医院',
        'city' => '市级医院',
        'county' => '县级医院',
        'township' => '乡镇卫生院',
        'village' => '村卫生室',
    ];

    /**
     * 机构列表（§3.1）
     */
    public function list(array $filters): array
    {
        $query = Organization::query();

        $levels = trim((string) ($filters['level'] ?? ''));
        if ($levels !== '') {
            $query->whereIn('level', array_filter(array_map('trim', explode(',', $levels))));
        }

        $keyword = trim((string) ($filters['keyword'] ?? ''));
        if ($keyword !== '') {
            $query->where(function ($q) use ($keyword) {
                $q->where('org_name', 'like', "%{$keyword}%")
                    ->orWhere('short_name', 'like', "%{$keyword}%");
            });
        }

        $list = $query->orderBy('org_code')->get()
            ->map(fn (Organization $org) => $this->summary($org))
            ->values()->all();

        return ['total' => count($list), 'list' => $list];
    }

    /**
     * 科室结构（§3.4）
     */
    public function departments(string $id): array
    {
        $org = $this->findOrg($id);

        $departments = Department::query()
            ->where('org_id', $org->id)
            ->orderBy('dept_code')
            ->get()
            ->map(fn (Department $d) => [
                'deptId' => $d->dept_code,
                'name' => $d->dept_name,
                'parentDeptId' => null,
            ])->values()->all();

        if ($departments === []) {
            // 乡镇 / 村级机构通常无科室，返回演示工作单元
            $departments = [[
                'deptId' => $org->org_code,
                'name' => $org->org_name,
                'parentDeptId' => null,
            ]];
        }

        return [
            'orgId' => $org->org_code,
            'departments' => $departments,
        ];
    }

    /**
     * 机构权限范围（§3.5）
     *
     * 项目无权限表，按文档示例返回固定权限字典。
     */
    public function permissions(string $id): array
    {
        $org = $this->findOrg($id);

        $permissions = [
            ['permId' => "PERM-{$org->org_code}-view", 'permKey' => 'patient.view', 'scope' => 'LOCAL', 'remark' => '查看本院患者'],
            ['permId' => "PERM-{$org->org_code}-transfer", 'permKey' => 'transfer.accept', 'scope' => 'LOWER', 'remark' => '接收下级转诊'],
            ['permId' => "PERM-{$org->org_code}-consult", 'permKey' => 'consult.join', 'scope' => 'PARTNER', 'remark' => '参与协作会诊'],
        ];

        return ['orgId' => $org->org_code, 'permissions' => $permissions];
    }

    /**
     * 机构列表项字段
     */
    public function summary(Organization $org): array
    {
        return [
            'orgId' => $org->org_code,
            'name' => $org->org_name,
            'shortName' => $org->short_name,
            'level' => $org->level,
            'levelLabel' => self::LEVEL_LABELS[$org->level] ?? '',
            'province' => $org->province,
            'city' => $org->city,
            'county' => $org->county_name,
            'town' => $org->town,
            'verified' => (bool) $org->verified,
            'currentOperationVerified' => (bool) $org->current_operation_verified,
            'verificationScope' => $org->verification_scope,
        ];
    }

    /**
     * 按机构编码取机构，不存在则 404
     */
    private function findOrg(string $id): Organization
    {
        $org = Organization::query()->where('org_code', $id)->first();
        $this->assert($org !== null, ResponseCode::NOT_FOUND, '机构不存在');

        return $org;
    }
}
