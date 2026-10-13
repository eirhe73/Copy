<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\CareCenter;
use App\Models\CareCenterProfile;
use App\Models\Department;
use App\Models\Organization;

/**
 * 急救监控 · 2.6 五大中心业务服务
 */
class CareCenterService extends Service
{
    /**
     * §3.1 获取五大中心列表
     */
    public function index(array $filters): array
    {
        $orgId = $filters['orgId'] ?? null;

        $centers = CareCenter::query()->orderBy('sort')->orderBy('id')->get();

        $profiles = $orgId
            ? CareCenterProfile::query()->where('org_id', $orgId)->get()->keyBy('center_id')
            : collect();

        return [
            'updatedAt' => now()->toIso8601String(),
            'centers' => $centers->map(function (CareCenter $c) use ($profiles) {
                $profile = $profiles->get($c->center_id);

                return [
                    'centerId' => $c->center_id,
                    'name' => $c->name,
                    'leadDept' => $c->lead_dept,
                    'leadDeptName' => $this->deptName($c->lead_dept),
                    'visiblePatients' => (int) ($profile->visible_patients ?? 0),
                    'pendingTransfer' => (int) ($profile->pending_transfer ?? 0),
                    'status' => $c->status,
                ];
            })->all(),
        ];
    }

    /**
     * §3.2 获取中心能力画像
     */
    public function profile(string $id, ?string $orgId): array
    {
        $center = $this->findCenter($id);

        $profile = CareCenterProfile::query()
            ->where('center_id', $center->center_id)
            ->where('org_id', $orgId ?? '')
            ->first();

        return [
            'centerId' => $center->center_id,
            'name' => $center->name,
            'orgId' => $orgId,
            'orgName' => $orgId ? Organization::query()->where('org_code', $orgId)->value('org_name') : null,
            'leadDept' => $center->lead_dept,
            'leadDeptName' => $this->deptName($center->lead_dept),
            'relatedDepts' => $center->related_depts ?? [],
            'visiblePatients' => (int) ($profile->visible_patients ?? 0),
            'pendingTransfer' => (int) ($profile->pending_transfer ?? 0),
            'teamSize' => (int) ($profile->team_size ?? 0),
            'equipment' => $profile->equipment ?? [],
            'annualVolume' => (int) ($profile->annual_volume ?? 0),
            'pathwayRate' => (float) ($profile->pathway_rate ?? 0),
            'assessmentNote' => $profile->assessment_note ?? '',
            'profiledAt' => $profile?->profiled_at?->toIso8601String(),
        ];
    }

    /**
     * §3.3 更新中心能力画像（按 center_id + org_id upsert）
     */
    public function updateProfile(string $id, array $data): array
    {
        $center = $this->findCenter($id);
        $orgId = (string) $data['orgId'];

        $this->assert(
            Organization::query()->where('org_code', $orgId)->exists(),
            ResponseCode::BAD_REQUEST,
            '机构不存在'
        );

        $profiledAt = now();

        $values = ['profiled_at' => $profiledAt];
        $columnMap = [
            'teamSize' => 'team_size',
            'equipment' => 'equipment',
            'annualVolume' => 'annual_volume',
            'pathwayRate' => 'pathway_rate',
            'assessmentNote' => 'assessment_note',
        ];
        foreach ($columnMap as $key => $column) {
            if (array_key_exists($key, $data)) {
                $values[$column] = $data[$key];
            }
        }

        CareCenterProfile::updateOrCreate(
            ['center_id' => $center->center_id, 'org_id' => $orgId],
            $values
        );

        return [
            'centerId' => $center->center_id,
            'orgId' => $orgId,
            'profiledAt' => $profiledAt->toIso8601String(),
        ];
    }

    /**
     * 中心编号兼容 center_id 与自增主键
     */
    private function findCenter(string $id): CareCenter
    {
        $center = CareCenter::query()->where('center_id', $id)->first();

        if (! $center && ctype_digit($id)) {
            $center = CareCenter::query()->find((int) $id);
        }

        $this->assert($center instanceof CareCenter, ResponseCode::NOT_FOUND, '中心不存在');

        return $center;
    }

    private function deptName(?string $deptCode): string
    {
        if (! $deptCode) {
            return '';
        }

        return (string) Department::query()->where('dept_code', $deptCode)->value('dept_name');
    }
}
