<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeviceRequest;
use App\Http\Requests\UpdateDeviceBindingRequest;
use App\Http\Requests\UpdateDeviceRequest;
use App\Services\DeviceService;
use App\Support\Result;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function __construct(private readonly DeviceService $service)
    {
    }

    /** §3.1 设备台账与床位列表 */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->index(['ward' => $request->input('ward')]));
    }

    /** §5.1 新增设备 */
    public function store(StoreDeviceRequest $request): array
    {
        return Result::success('新增成功', $this->service->store($request->validated()));
    }

    /** §3.2 设备改绑/解绑床位 */
    public function updateBinding(UpdateDeviceBindingRequest $request, string $deviceId): array
    {
        return Result::success('绑定成功', $this->service->updateBinding($deviceId, $request->validated()));
    }

    /** §5.2 更新设备 */
    public function update(UpdateDeviceRequest $request, string $id): array
    {
        return Result::success('更新成功', $this->service->update($id, $request->validated()));
    }

    /** §5.3 设备巡检记录 */
    public function inspections(Request $request): array
    {
        return Result::success('获取成功', $this->service->inspections($request->query()));
    }
}
