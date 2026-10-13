<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCenterProfileRequest;
use App\Services\CareCenterService;
use App\Support\Result;
use Illuminate\Http\Request;

class CareCenterController extends Controller
{
    public function __construct(private readonly CareCenterService $service)
    {
    }

    /** §3.1 五大中心列表 */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->index(['orgId' => $request->input('orgId')]));
    }

    /** §3.2 中心能力画像 */
    public function profile(Request $request, string $id): array
    {
        return Result::success('获取成功', $this->service->profile($id, $request->input('orgId')));
    }

    /** §3.3 更新中心能力画像 */
    public function updateProfile(UpdateCenterProfileRequest $request, string $id): array
    {
        return Result::success('保存成功', $this->service->updateProfile($id, $request->validated()));
    }
}
