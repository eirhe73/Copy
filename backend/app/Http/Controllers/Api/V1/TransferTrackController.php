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

    /**
     * 车载监护（§3.12）
     */
    public function monitor(Request $request, string $transferNo): array
    {
        $filters = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        return Result::success('获取成功', $this->service->monitor($transferNo, $filters));
    }

    /**
     * 到院交接清单（§3.13）
     */
    public function handoverList(string $transferNo): array
    {
        return Result::success('获取成功', $this->service->handoverList($transferNo));
    }
}
