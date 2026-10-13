<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\VehicleGpsService;
use App\Support\Result;

class VehicleGpsController extends Controller
{
    public function __construct(private readonly VehicleGpsService $service)
    {
    }

    /**
     * 在途车辆 GPS 与 ETA（§8 3.2）
     */
    public function index(): array
    {
        return Result::success('获取成功', $this->service->index());
    }
}
