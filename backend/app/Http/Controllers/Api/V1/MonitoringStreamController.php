<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PtzControlRequest;
use App\Services\MonitoringStreamService;
use App\Support\Result;
use Illuminate\Http\Request;

class MonitoringStreamController extends Controller
{
    public function __construct(private readonly MonitoringStreamService $service)
    {
    }

    /**
     * 监控流列表（§3.4）
     */
    public function index(Request $request): array
    {
        $filters = [
            'kind' => $request->input('kind'),
            'institutionId' => $request->input('institutionId'),
            'onlineOnly' => $request->boolean('onlineOnly'),
        ];

        return Result::success('获取成功', $this->service->index($filters));
    }

    /**
     * 单路监控画面（§3.5）
     */
    public function show(string $streamId): array
    {
        return Result::success('获取成功', $this->service->detail($streamId));
    }

    /**
     * 云台控制（§3.6）
     */
    public function ptz(PtzControlRequest $request): array
    {
        return Result::success('操作已受理', $this->service->ptz($request->validated()));
    }
}
