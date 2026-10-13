<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectTransferRequest;
use App\Http\Requests\StoreTransferRequest;
use App\Http\Requests\UpdateTransferRequest;
use App\Http\Resources\TransferResource;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TransferController extends Controller
{
    /**
     * 转诊单列表（基层调度链）
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Transfer::query()->with(['fromOrg', 'toOrg', 'patient', 'vehicle']);

        $query->when($request->input('transfer_status'), fn ($q, $v) => $q->where('transfer_status', $v))
            ->when($request->input('confirm_status'), fn ($q, $v) => $q->where('confirm_status', $v))
            ->when($request->input('urgency_level'), fn ($q, $v) => $q->where('urgency_level', $v))
            ->when($request->input('from_org_id'), fn ($q, $v) => $q->where('from_org_id', $v))
            ->when($request->input('to_org_id'), fn ($q, $v) => $q->where('to_org_id', $v))
            ->when($request->input('event_id'), fn ($q, $v) => $q->where('event_id', $v))
            ->when($request->input('keyword'), fn ($q, $v) => $q->where('transfer_code', 'like', "%{$v}%"));

        $transfers = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return TransferResource::collection($transfers);
    }

    /**
     * 发起转诊（上转申请）
     */
    public function store(StoreTransferRequest $request): JsonResponse
    {
        $transfer = Transfer::create($request->validated());
        $transfer->refresh();
        $transfer->load(['fromOrg', 'toOrg', 'patient', 'vehicle']);

        return (new TransferResource($transfer))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * 转诊单详情
     */
    public function show(Transfer $transfer): TransferResource
    {
        $transfer->load(['fromOrg', 'toOrg', 'patient', 'vehicle', 'event']);

        return new TransferResource($transfer);
    }

    /**
     * 更新转诊单（安排车辆 / 更新体征 / 资源准备）
     */
    public function update(UpdateTransferRequest $request, Transfer $transfer): TransferResource
    {
        $transfer->update($request->validated());
        $transfer->load(['fromOrg', 'toOrg', 'patient', 'vehicle']);

        return new TransferResource($transfer);
    }

    /**
     * 接收方确认
     */
    public function confirm(Request $request, Transfer $transfer): TransferResource
    {
        $validated = $request->validate([
            'confirmed_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'review_note' => ['nullable', 'string', 'max:500'],
        ]);

        $transfer->update([
            'confirm_status' => 'CONFIRM_CONFIRMED',
            'transfer_status' => 'TRANSFER_CONFIRMED',
            'confirmed_at' => now(),
            'confirmed_by_user_id' => $validated['confirmed_by_user_id'] ?? null,
            'review_note' => $validated['review_note'] ?? $transfer->review_note,
        ]);

        return new TransferResource($transfer);
    }

    /**
     * 接收方拒绝
     */
    public function reject(RejectTransferRequest $request, Transfer $transfer): TransferResource
    {
        $validated = $request->validated();

        $transfer->update([
            'confirm_status' => 'CONFIRM_REJECTED',
            'transfer_status' => 'TRANSFER_REJECTED',
            'confirmed_at' => now(),
            'confirmed_by_user_id' => $validated['confirmed_by_user_id'] ?? null,
            'reject_reason' => $validated['reject_reason'],
        ]);

        return new TransferResource($transfer);
    }

    /**
     * 删除转诊单（软删除）
     */
    public function destroy(Transfer $transfer): Response
    {
        $transfer->delete();

        return response()->noContent();
    }
}
