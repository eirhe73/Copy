<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ResponseCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptMobileReceptionRequest;
use App\Models\Department;
use App\Models\MobileReception;
use App\Models\Organization;
use App\Support\Result;
use Illuminate\Http\Request;

class MobileReceptionController extends Controller
{
    private const STEP_LABELS = [
        'registered' => '已登记',
        'assessment' => '已评估',
        'consultation' => '会诊中',
        'requested' => '待接收',
        'admitted' => '已接诊',
        'closed' => '本地处置结束',
        'sms' => '身份待核实',
    ];

    /** 可接收重症患者的机构层级（中心/市级/县级） */
    private const RECEPTION_LEVELS = ['center', 'city', 'county'];

    /**
     * §3.3 手机重症接收详情
     */
    public function show(string $token): array
    {
        $reception = MobileReception::query()->where('token', $token)->first();
        if ($reception === null) {
            throw new BusinessException(ResponseCode::NOT_FOUND, '接收链接已失效，请重新获取');
        }

        $step = $reception->status === 'accepted' ? 'admitted' : 'requested';

        return Result::success('获取成功', [
            'token' => $reception->token,
            'receptionId' => $reception->reception_id,
            'journeyId' => $reception->journey_id,
            'patientId' => $reception->patient_id,
            'patientName' => $reception->patient_name,
            'gender' => $reception->gender,
            'age' => $reception->age,
            'phone' => $reception->phone,
            'sourceInstitutionId' => $reception->source_institution_id,
            'sourceDepartmentId' => $reception->source_department_id,
            'sourceInstitutionName' => $this->orgName($reception->source_institution_id),
            'sourceDepartmentName' => $this->deptName($reception->source_department_id),
            'step' => $step,
            'stepLabel' => self::STEP_LABELS[$step] ?? $step,
            'prehospital' => [
                'category' => $reception->category,
                'complaint' => $reception->complaint,
                'specialty' => $reception->symptoms ?? [],
            ],
            'messages' => [],
            'availableInstitutions' => $this->institutionList(),
            'availableDepartments' => [],
            'prepChecklist' => $reception->prep_checklist ?? $this->defaultChecklist(),
            'acceptedInstitutionId' => $reception->accepted_institution_id,
            'acceptedDepartmentId' => $reception->accepted_department_id,
            'status' => $reception->status,
        ]);
    }

    /**
     * §3.4 科室接收确认（幂等：已确认/已超时返回 409）
     */
    public function accept(AcceptMobileReceptionRequest $request, string $token): array
    {
        $reception = MobileReception::query()->where('token', $token)->first();
        if ($reception === null) {
            throw new BusinessException(ResponseCode::NOT_FOUND, '接收单不存在');
        }
        if ($reception->status === 'accepted') {
            throw new BusinessException(ResponseCode::CONFLICT, '该接收单已确认过');
        }
        if ($reception->status === 'timeout') {
            throw new BusinessException(ResponseCode::CONFLICT, '接收单已超时');
        }

        $data = $request->validated();

        $reception->update([
            'status' => 'accepted',
            'accepted_institution_id' => $data['institutionId'],
            'accepted_department_id' => $data['departmentId'],
            'accepted_by' => $data['assigneeId'] ?? '',
            'prep_checklist' => $data['prepChecklist'] ?? $reception->prep_checklist,
            'accepted_at' => now(),
        ]);

        return Result::success('接收成功', [
            'receptionId' => $reception->reception_id,
            'token' => $reception->token,
            'status' => $reception->status,
            'acceptedInstitutionId' => $reception->accepted_institution_id,
            'acceptedDepartmentId' => $reception->accepted_department_id,
            'acceptedAt' => $reception->accepted_at?->toIso8601String(),
        ]);
    }

    /**
     * §3.5 可选机构（机构下拉）
     */
    public function institutions(): array
    {
        return Result::success('获取成功', $this->institutionList());
    }

    /**
     * §3.6 可选科室（科室下拉，按机构编码）
     */
    public function departments(Request $request): array
    {
        $institutionId = $request->query('institutionId');
        if (! $institutionId) {
            throw new BusinessException(ResponseCode::BAD_REQUEST, '缺少 institutionId 参数');
        }

        $org = Organization::query()->where('org_code', $institutionId)->first();
        if ($org === null) {
            throw new BusinessException(ResponseCode::NOT_FOUND, '机构不存在');
        }

        $depts = Department::query()
            ->where('org_id', $org->id)
            ->orderBy('dept_code')
            ->get()
            ->map(fn (Department $d) => [
                'deptId' => $d->dept_code,
                'name' => $d->dept_name,
            ])->values()->all();

        return Result::success('获取成功', [
            'institutionId' => $institutionId,
            'total' => count($depts),
            'list' => $depts,
        ]);
    }

    private function institutionList(): array
    {
        $orgs = Organization::query()
            ->whereIn('level', self::RECEPTION_LEVELS)
            ->orderBy('level')
            ->get()
            ->map(fn (Organization $o) => [
                'institutionId' => $o->org_code,
                'name' => $o->org_name,
                'level' => $o->level,
            ])->values()->all();

        return ['total' => count($orgs), 'list' => $orgs];
    }

    private function orgName(?string $orgCode): string
    {
        if (! $orgCode) {
            return '';
        }

        return Organization::query()->where('org_code', $orgCode)->value('org_name') ?? '';
    }

    private function deptName(?string $deptCode): string
    {
        if (! $deptCode) {
            return '';
        }

        return Department::query()->where('dept_code', $deptCode)->value('dept_name') ?? '';
    }

    private function defaultChecklist(): array
    {
        return [
            ['key' => 'bed', 'title' => '预留床位', 'done' => false, 'note' => ''],
            ['key' => 'respiratory', 'title' => '呼吸支持设备', 'done' => false, 'note' => ''],
            ['key' => 'imaging', 'title' => 'CT 检查绿色通道', 'done' => false, 'note' => ''],
        ];
    }
}
