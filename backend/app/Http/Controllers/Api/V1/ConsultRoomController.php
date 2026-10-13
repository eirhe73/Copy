<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\JoinRoomRequest;
use App\Http\Requests\StoreOpinionRequest;
use App\Services\ConsultRoomService;
use App\Support\Result;
use Illuminate\Http\Request;

class ConsultRoomController extends Controller
{
    public function __construct(private readonly ConsultRoomService $service)
    {
    }

    /** 会诊室信息 */
    public function show(string $token): array
    {
        return Result::success('获取成功', $this->service->show($token));
    }

    /** 临床资料 */
    public function materials(Request $request, string $token): array
    {
        return Result::success('获取成功', $this->service->materials($token, $request->query('kind')));
    }

    /** 提交会诊意见 */
    public function opinions(StoreOpinionRequest $request, string $token): array
    {
        return Result::success('提交成功', $this->service->opinions($token, $request->validated()));
    }

    /** 患者入会 */
    public function join(JoinRoomRequest $request, string $token): array
    {
        return Result::success('获取成功', $this->service->join($token, $request->validated()));
    }
}
