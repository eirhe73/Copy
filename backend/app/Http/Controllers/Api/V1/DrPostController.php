<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDrPostRequest;
use App\Http\Resources\DrPostResource;
use App\Models\DrPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrPostController extends Controller
{
    /**
     * 基层反馈列表（category 区分反馈/上报）
     */
    public function index(Request $request): JsonResponse
    {
        $pageNum = max((int) ($request->input('pageNum', 1)), 1);
        $pageSize = min(max((int) ($request->input('pageSize', 20)), 1), 100);

        $query = DrPost::query()
            ->when($request->input('category'), fn ($q, $v) => $q->where('category', $v))
            ->when($request->input('status'), function ($q, $v) {
                $statusList = array_filter(array_map('trim', explode(',', (string) $v)));
                if ($statusList) {
                    $q->whereIn('status', $statusList);
                }
            })
            ->when($request->input('institutionId'), fn ($q, $v) => $q->where('institution_id', $v))
            ->when($request->input('keyword'), function ($q, $v) {
                $q->where(fn ($sub) => $sub->where('title', 'like', "%{$v}%")->orWhere('content', 'like', "%{$v}%"));
            });

        $paginator = $query->orderByDesc('created_at')->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        return response()->json([
            'total' => $paginator->total(),
            'list' => DrPostResource::collection($paginator->items())->resolve(),
        ]);
    }

    /**
     * 问题上报（提交上报）
     */
    public function store(StoreDrPostRequest $request): JsonResponse
    {
        $data = $request->validated();

        $post = DrPost::create([
            'category' => $data['category'],
            'title' => $data['title'],
            'content' => $data['content'],
            'institution_id' => $data['institutionId'],
            'institution_name' => $data['institutionName'] ?? '',
            'department' => $data['department'] ?? '',
            'reporter_id' => $data['reporterId'] ?? '',
            'reporter_name' => $data['reporterName'] ?? '',
            'contact' => $data['contact'] ?? '',
            'priority' => $data['priority'] ?? 0,
            'attachments' => $data['attachments'] ?? null,
            'status' => 'PENDING',
        ]);

        return response()->json([
            'postId' => $post->post_id,
            'status' => $post->status,
            'statusLabel' => '待处理',
            'createdAt' => $post->created_at?->toIso8601String(),
        ], 201);
    }
}
