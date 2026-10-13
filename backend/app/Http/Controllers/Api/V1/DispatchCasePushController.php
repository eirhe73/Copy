<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CasePushRequest;
use App\Services\CasePushService;
use App\Support\Result;

class DispatchCasePushController extends Controller
{
    public function __construct(private readonly CasePushService $service)
    {
    }

    /**
     * 院前病例推送
     */
    public function index(CasePushRequest $request): array
    {
        return Result::success('获取成功', $this->service->index($request->validated()));
    }
}
