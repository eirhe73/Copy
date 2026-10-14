<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDrPostRequest;
use App\Services\DrService;
use App\Support\Result;
use Illuminate\Http\Request;

/**
 * 基层医声 · 基层反馈 / 问题上报（04-会诊协同 §3.1~§3.2）
 */
class DrPostController extends Controller
{
    public function __construct(private readonly DrService $service)
    {
    }

    /** §3.1 获取基层反馈列表 */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->posts($request->query()));
    }

    /** §3.2 问题上报 */
    public function store(StoreDrPostRequest $request): array
    {
        return Result::success('提交成功', $this->service->storePost($request->validated()));
    }
}
