<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\MessageService;
use App\Support\Result;
use Illuminate\Http\Request;

/**
 * 急救监控 · 消息中心
 */
class MessageController extends Controller
{
    public function __construct(private readonly MessageService $service)
    {
    }

    /** §3.1 站内消息列表 */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->index($request->query()));
    }

    /** §3.2 服务通知列表 */
    public function notifications(Request $request): array
    {
        return Result::success('获取成功', $this->service->notifications($request->query()));
    }

    /** §3.3 待办提醒 */
    public function todos(Request $request): array
    {
        return Result::success('获取成功', $this->service->todos($request->query()));
    }
}
