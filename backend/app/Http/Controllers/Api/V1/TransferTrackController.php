<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\TransferTrackService;
use App\Support\Result;
use Illuminate\Http\Request;

class TransferTrackController extends Controller
{
    public function __construct(private readonly TransferTrackService $service)
    {
    }

    /**
     * 转运任务详情（§3.11）
     */
    public function show(string $transferNo): array
    {
        return Result::success('获取成功', $this->service->detail($transferNo));
    }

    /**
     * 轨迹回放（§3.2）
     */
    public function track(Request $request, string $transferNo): array
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        return Result::success('获取成功', $this->service->track($transferNo, $filters));
    }
}
