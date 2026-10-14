<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveDashboardLayoutRequest;
use App\Services\DashboardLayoutService;
use App\Support\Result;
use Illuminate\Http\Request;

class DashboardLayoutController extends Controller
{
    public function __construct(private readonly DashboardLayoutService $service)
    {
    }

    /**
     * §3.6 读取看板布局（缺省按 user → role → default 回退）
     */
    public function layout(Request $request): array
    {
        return Result::success('获取成功', $this->service->read($request->query('scope')));
    }

    /**
     * §3.7 保存看板布局（乐观锁版本校验）
     */
    public function saveLayout(SaveDashboardLayoutRequest $request): array
    {
        return Result::success('保存成功', $this->service->save($request->validated()));
    }
}
