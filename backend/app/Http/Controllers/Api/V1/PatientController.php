<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePatientRequest;
use App\Services\PatientService;
use App\Support\Result;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PatientController extends Controller
{
    public function __construct(private readonly PatientService $service)
    {
    }

    /**
     * 患者列表（§3.2）
     */
    public function index(Request $request): array
    {
        $filters = $request->only(['stage', 'keyword', 'institutionId', 'departmentId', 'pageNum', 'pageSize']);

        return Result::success('获取成功', $this->service->index($filters));
    }

    /**
     * 患者详情（§3.3）
     */
    public function show(string $patient): array
    {
        return Result::success('获取成功', $this->service->show($patient));
    }

    /**
     * 更新患者信息（§3.7）
     */
    public function update(UpdatePatientRequest $request, string $patient): array
    {
        return Result::success('更新成功', $this->service->update($patient, $request->validated()));
    }

    /**
     * 删除患者（软删除）
     */
    public function destroy(string $patient): Response
    {
        $this->service->delete($patient);

        return response()->noContent();
    }
}
