<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDrMessageRequest;
use App\Http\Resources\DrMessageResource;
use App\Models\DrMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrMessageController extends Controller
{
    /**
     * 协作消息流（倒序，beforeId 游标翻页）
     */
    public function index(Request $request): JsonResponse
    {
        $pageSize = min(max((int) ($request->input('pageSize', 20)), 1), 100);

        $query = DrMessage::query()
            ->when($request->input('threadId'), fn ($q, $v) => $q->where('thread_id', $v))
            ->when($request->input('institutionId'), fn ($q, $v) => $q->where('institution_id', $v))
            ->when($request->input('kind'), fn ($q, $v) => $q->where('kind', $v));

        // beforeId 游标：取该消息之前的消息
        if ($request->input('beforeId')) {
            $anchor = DrMessage::query()->where('message_id', $request->input('beforeId'))->first();
            if ($anchor) {
                $query->where('created_at', '<', $anchor->created_at);
            }
        }

        $messages = $query->orderByDesc('created_at')->limit($pageSize)->get();

        return response()->json([
            'total' => $messages->count(),
            'list' => DrMessageResource::collection($messages)->resolve(),
        ]);
    }

    /**
     * 发送协作消息（首条缺省新建链路）
     */
    public function store(StoreDrMessageRequest $request): JsonResponse
    {
        $data = $request->validated();

        $threadId = $data['threadId'] ?? '';
        if ($threadId === '') {
            $threadId = 'thread-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        $message = DrMessage::create([
            'thread_id' => $threadId,
            'institution_id' => $data['institutionId'] ?? '',
            'institution_name' => $data['institutionName'] ?? '',
            'sender_id' => $data['senderId'] ?? '',
            'sender_name' => $data['senderName'] ?? '',
            'kind' => $data['kind'],
            'content' => $data['content'] ?? '',
            'media_url' => $data['mediaUrl'] ?? '',
            'duration_sec' => $data['durationSec'] ?? 0,
            'is_read' => false,
        ]);

        return response()->json([
            'messageId' => $message->message_id,
            'threadId' => $message->thread_id,
            'kind' => $message->kind,
            'createdAt' => $message->created_at?->toIso8601String(),
        ], 201);
    }
}
