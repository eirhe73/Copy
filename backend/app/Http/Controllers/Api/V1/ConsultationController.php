<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptConsultationRequest;
use App\Http\Requests\StoreConsultationRequest;
use App\Services\ConsultationService;
use App\Support\Result;
use Illuminate\Http\Request;

class ConsultationController extends Controller
{
    public function __construct(private readonly ConsultationService $service)
    {
    }

    /** 会诊队列 */
    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->index($request->query()));
    }

    /** 发起会诊 */
    public function store(StoreConsultationRequest $request): array
    {
        return Result::success('获取成功', $this->service->store($request->validated()));
    }

    /** 入院会诊会话 */
    public function admission(): array
    {
        return Result::success('获取成功', $this->service->admission());
    }

    /** 会诊详情 */
    public function show(string $sessionId): array
    {
        return Result::success('获取成功', $this->service->show($sessionId));
    }

    /** 可选接诊医生 */
    public function doctors(Request $request): array
    {
        return Result::success('获取成功', $this->service->doctors($request->query()));
    }

    /** 医生接诊 */
    public function accept(AcceptConsultationRequest $request, string $sessionId): array
    {
        return Result::success('获取成功', $this->service->accept($sessionId, $request->validated()));
    }

    /** 入会链接：跳转远程会诊系统的地址（未对接时返回本地占位会诊室） */
    public function joinLink(Request $request, string $sessionId): array
    {
        return Result::success('获取成功', $this->service->joinLink($sessionId, $request->query()));
    }
}
