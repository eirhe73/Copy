<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHandoverRequest;
use App\Services\HandoverService;
use App\Support\Result;

class DispatchHandoverController extends Controller
{
    public function __construct(private readonly HandoverService $service)
    {
    }

    /**
     * 到院交接
     */
    public function store(StoreHandoverRequest $request): array
    {
        return Result::success('获取成功', $this->service->store($request->validated()));
    }
}
