<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDrMessageRequest;
use App\Services\DrService;
use App\Support\Result;
use Illuminate\Http\Request;

/**
 * 基层医声 · 协作消息（04-会诊协同 §3.3~§3.4）
 */
class DrMessageController extends Controller
{
    public function __construct(private readonly DrService $service)
    {
    }

    /** §3.3 获取协作消息（消息流） */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->messages($request->query()));
    }

    /** §3.4 发送消息 */
    public function store(StoreDrMessageRequest $request): array
    {
        return Result::success('提交成功', $this->service->storeMessage($request->validated()));
    }
}
