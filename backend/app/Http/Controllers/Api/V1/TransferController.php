<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{RejectTransferRequest, StoreTransferRequest, UpdateTransferRequest};
use App\Models\Transfer;
use App\Services\TransferService;
use App\Support\Result;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TransferController extends Controller
{
    public function __construct(private readonly TransferService $service) {}

    public function index(Request $request): array { return Result::success('获取成功', $this->service->index($request->only(['direction', 'status', 'keyword', 'pageNum', 'pageSize']))); }

    public function store(StoreTransferRequest $request): array { return Result::success('发起成功', $this->service->store($request->validated())); }

    public function show(Transfer $transfer): array { return Result::success('获取成功', $this->service->show($transfer)); }

    public function update(UpdateTransferRequest $request, Transfer $transfer): array { return Result::success('更新成功', $this->service->update($transfer, $request->validated())); }

    public function confirm(Transfer $transfer): array { return Result::success('接收成功', $this->service->confirm($transfer)); }

    public function reject(RejectTransferRequest $request, Transfer $transfer): array { return Result::success('已拒绝', $this->service->reject($transfer)); }

    public function destroy(Transfer $transfer): Response { $transfer->delete(); return response()->noContent(); }

    public function greenChannel(Request $request): array { return Result::success('获取成功', $this->service->greenChannel($request->input('institutionId', $request->input('institution_id')))); }

    public function responseTime(Request $request): array { return Result::success('获取成功', $this->service->responseTime($request->only(['days', 'institutionId', 'institution_id']))); }
}
