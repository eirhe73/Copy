<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CareBindingService;
use App\Support\Result;
use Illuminate\Http\Request;

class CareBindingController extends Controller
{
    public function __construct(private readonly CareBindingService $service)
    {
    }

    /**
     * 床-患-设备四元绑定（§11.2）
     */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->index($request->only(['scope', 'hospital'])));
    }
}
