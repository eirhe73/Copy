<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OcrIdRequest;
use App\Http\Requests\PreAdmissionRequest;
use App\Http\Requests\StorePatientRegistrationRequest;
use App\Services\PatientRegistrationService;
use App\Support\Result;

class PatientRegistrationController extends Controller
{
    public function __construct(private readonly PatientRegistrationService $service)
    {
    }

    /**
     * 急救医生快速登记（院内）
     */
    public function store(StorePatientRegistrationRequest $request): array
    {
        return Result::success('获取成功', $this->service->store($request->validated()));
    }

    /**
     * 身份证 OCR 识别
     */
    public function ocrId(OcrIdRequest $request): array
    {
        return Result::success('获取成功', $this->service->ocrId($request->validated()));
    }

    /**
     * 院前信息上报
     */
    public function preAdmission(PreAdmissionRequest $request): array
    {
        return Result::success('获取成功', $this->service->preAdmission($request->validated()));
    }
}
