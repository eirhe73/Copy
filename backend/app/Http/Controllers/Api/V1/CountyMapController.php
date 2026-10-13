<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CountyMapService;
use App\Support\Result;
use Illuminate\Http\Request;

class CountyMapController extends Controller
{
    public function __construct(private readonly CountyMapService $service)
    {
    }

    /**
     * 县域地图聚合（§11.1）
     */
    public function index(Request $request): array
    {
        $filters = [
            'region' => $request->query('region'),
            'withVehicles' => $request->boolean('withVehicles', true),
        ];

        return Result::success('获取成功', $this->service->index($filters));
    }
}
