<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignDispatchTaskRequest;
use App\Services\DispatchTaskService;
use App\Support\Result;

class DispatchTaskController extends Controller
{
    public function __construct(private readonly DispatchTaskService $service)
    {
    }

    /**
     * 任务分派：为急救事件指派救护车与随车班组
     */
    public function assign(AssignDispatchTaskRequest $request): array
    {
        return Result::success('获取成功', $this->service->assign($request->validated()));
    }
}
