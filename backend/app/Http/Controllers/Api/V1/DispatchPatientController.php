<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDispatchPatientRequest;
use App\Services\DispatchPatientService;
use App\Support\Result;

class DispatchPatientController extends Controller
{
    public function __construct(private readonly DispatchPatientService $service)
    {
    }

    /**
     * 提交/保存急救患者登记（车上就近登记）
     */
    public function store(StoreDispatchPatientRequest $request): array
    {
        return Result::success('获取成功', $this->service->store($request->validated()));
    }
}
