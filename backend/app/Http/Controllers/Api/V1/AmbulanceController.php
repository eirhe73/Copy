<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AmbulanceService;
use App\Support\Result;

class AmbulanceController extends Controller
{
    public function __construct(private readonly AmbulanceService $service)
    {
    }

    /**
     * 救护车列表（§3.3）
     */
    public function index(): array
    {
        return Result::success('获取成功', $this->service->list());
    }

    /**
     * 救护车详情（§3.8）
     */
    public function show(string $vehicleId): array
    {
        return Result::success('获取成功', $this->service->detail($vehicleId));
    }
}
