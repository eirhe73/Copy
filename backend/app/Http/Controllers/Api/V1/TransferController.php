<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectTransferRequest;
use App\Http\Requests\StoreTransferRequest;
use App\Http\Requests\UpdateTransferRequest;
use App\Http\Resources\TransferResource;
use App\Models\Organization;
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

    /**
     * 华西绿色通道（§2.3.5，配置类，占位字段）
     */
    public function greenChannel(Request $request): JsonResponse
    {
        $channels = [
            ['type' => 'chest_pain', 'name' => '胸痛中心', 'openCount' => 0, 'reservedBeds' => 0, 'avgResponseMinutes' => 0],
            ['type' => 'stroke', 'name' => '卒中中心', 'openCount' => 0, 'reservedBeds' => 0, 'avgResponseMinutes' => 0],
            ['type' => 'trauma', 'name' => '创伤中心', 'openCount' => 0, 'reservedBeds' => 0, 'avgResponseMinutes' => 0],
            ['type' => 'critical_pregnant', 'name' => '危重孕产妇', 'openCount' => 0, 'reservedBeds' => 0, 'avgResponseMinutes' => 0],
            ['type' => 'neonatal', 'name' => '危重新生儿', 'openCount' => 0, 'reservedBeds' => 0, 'avgResponseMinutes' => 0],
        ];

        return response()->json([
            'updatedAt' => now()->toIso8601String(),
            'channels' => $channels,
        ]);
    }

    /**
     * 响应时长统计（§2.3.6：口径 = confirmed_at - started_at，仅计入已接收）
     */
    public function responseTime(Request $request): JsonResponse
    {
        $days = min(max((int) ($request->input('days', 7)), 1), 90);
        $from = now()->subDays($days);

        $rows = Transfer::query()
            ->whereNotNull('started_at')
            ->whereNotNull('confirmed_at')
            ->where('started_at', '>=', $from)
            ->when($request->input('institution_id'), fn ($q, $v) => $q->where('to_org_id', $v))
            ->get(['id', 'from_org_id', 'to_org_id', 'started_at', 'confirmed_at'])
            ->map(fn (Transfer $t) => [
                'minutes' => max(0, (int) $t->started_at->diffInMinutes($t->confirmed_at, false)),
                'orgId' => $t->to_org_id,
                'date' => $t->confirmed_at->toDateString(),
            ]);

        $minutes = $rows->pluck('minutes')->sort()->values();
        $count = $minutes->count();

        $avg = $count ? (float) round($minutes->avg(), 1) : 0;
        $min = $count ? (int) $minutes->first() : 0;
        $max = $count ? (int) $minutes->last() : 0;
        $p50 = $count ? (int) $minutes->get((int) floor(($count - 1) * 0.5)) : 0;
        $p90 = $count ? (int) $minutes->get((int) floor(($count - 1) * 0.9)) : 0;

        // 机构维度（按转入机构聚合）
        $byOrgIds = $rows->groupBy('orgId')->filter(fn ($g, $k) => $k !== null && $k !== '');
        $orgNames = Organization::query()->whereIn('id', $byOrgIds->keys())->pluck('org_name', 'id');

        $byInstitution = $byOrgIds->map(function ($group, $orgId) use ($orgNames) {
            $mins = $group->pluck('minutes');

            return [
                'institutionId' => (string) $orgId,
                'institutionName' => $orgNames[$orgId] ?? (string) $orgId,
                'count' => $mins->count(),
                'avgResponseMinutes' => (float) round($mins->avg(), 1),
            ];
        })->sortByDesc('count')->values()->all();

        // 按日趋势
        $trend = $rows->groupBy('date')->map(function ($group, $date) {
            return [
                'date' => $date,
                'avgResponseMinutes' => (float) round($group->pluck('minutes')->avg(), 1),
            ];
        })->sortKeys()->values()->all();

        return response()->json([
            'updatedAt' => now()->toIso8601String(),
            'avgResponseMinutes' => $avg,
            'p50Minutes' => $p50,
            'p90Minutes' => $p90,
            'minMinutes' => $min,
            'maxMinutes' => $max,
            'byInstitution' => $byInstitution,
            'trend' => $trend,
        ]);
    }
}
