<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDispatchEventRequest;
use App\Http\Requests\UpdateDispatchEventStatusRequest;
use App\Services\DispatchEventService;
use App\Support\Result;
use Illuminate\Http\Request;

class DispatchEventController extends Controller
{
    public function __construct(private readonly DispatchEventService $service)
    {
    }

    /**
     * 急救事件列表（实时出警 + 事件列表共用）
     */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->paginate($request->all()));
    }

    /**
     * 创建急救事件（接警建档）
     */
    public function store(StoreDispatchEventRequest $request): array
    {
        return Result::success('获取成功', $this->service->create($request->validated()));
    }

    /**
     * 急救事件详情
     */
    public function show(string $eventId): array
    {
        return Result::success('获取成功', $this->service->detail($eventId));
    }

    /**
     * 更新事件状态
     */
    public function update(UpdateDispatchEventStatusRequest $request, string $eventId): array
    {
        return Result::success('获取成功', $this->service->updateStatus($eventId, $request->validated()['status']));
    }
}
