<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Support\Result;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $service)
    {
    }

    /**
     * §3.1 一体化指挥总览
     */
    public function overview(Request $request): array
    {
        $filters = [
            'region' => $request->query('region'),
            'trendDays' => $request->query('trendDays', 30),
        ];

        return Result::success('获取成功', $this->service->overview($filters));
    }

    /**
     * §3.2 KPI 指标墙
     */
    public function kpi(Request $request): array
    {
        return Result::success('获取成功', $this->service->kpi($request->all()));
    }

    /**
     * §3.3 实时事件流
     */
    public function eventStream(Request $request): array
    {
        return Result::success('获取成功', $this->service->eventStream($request->all()));
    }

    /**
     * §3.4 急救调度概览
     */
    public function dispatchOverview(): array
    {
        return Result::success('获取成功', $this->service->dispatchOverview());
    }
}
