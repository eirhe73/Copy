<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PatientProfileService;
use App\Support\Result;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientProfileController extends Controller
{
    public function __construct(private readonly PatientProfileService $service)
    {
    }

    /** 临床时间轴（§3.4） */
    public function timeline(string $id): array
    {
        return Result::success('获取成功', $this->service->timeline($id));
    }

    /** 患者历史会诊记录（§3.5） */
    public function consultations(string $id): array
    {
        return Result::success('获取成功', $this->service->consultations($id));
    }

    /** 关联预警与处置（§3.6） */
    public function warnings(string $id): array
    {
        return Result::success('获取成功', $this->service->warnings($id));
    }

    /** 患者阶段字典（§3.10） */
    public function stages(): array
    {
        return Result::success('获取成功', $this->service->stages());
    }

    /** 患者列表导出 CSV（§3.9） */
    public function export(Request $request): StreamedResponse
    {
        return $this->service->export($request->only(['stage', 'keyword', 'institutionId', 'departmentId']));
    }
}
