<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Notification;
use App\Models\Todo;

/**
 * 急救监控 · 消息中心业务服务
 */
class MessageService extends Service
{
    /**
     * §3.1 站内消息列表（含未读统计）
     */
    public function index(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 10), 1), 100);

        $query = Message::query()
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v));

        $unread = (clone $query)->where('is_read', false)->count();

        $this->applyIsRead($query, $filters);

        $paginator = $query
            ->orderByDesc('at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (Message $m) => [
                'messageId' => $m->message_id,
                'title' => $m->title,
                'text' => $m->text,
                'isRead' => $m->is_read,
                'patientId' => $m->patient_id,
                'patientName' => $m->patient_name,
                'category' => $m->category,
                'link' => $m->link,
                'at' => $m->at?->toIso8601String(),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'unread' => $unread,
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * §3.2 服务通知列表
     */
    public function notifications(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 10), 1), 100);

        $query = Notification::query()
            ->when($filters['channel'] ?? null, fn ($q, $v) => $q->where('channel', $v));

        $unread = (clone $query)->where('is_read', false)->count();

        $this->applyIsRead($query, $filters);

        $paginator = $query
            ->orderByDesc('at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (Notification $n) => [
                'notificationId' => $n->notification_id,
                'title' => $n->title,
                'text' => $n->text,
                'isRead' => $n->is_read,
                'patientName' => $n->patient_name,
                'channel' => $n->channel,
                'token' => $n->token,
                'at' => $n->at?->toIso8601String(),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'unread' => $unread,
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * §3.3 待办提醒（待办汇总）
     */
    public function todos(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $query = Todo::query()
            ->when($filters['priority'] ?? null, fn ($q, $v) => $q->where('priority', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v));

        $openCount = (clone $query)->where('status', 'open')->count();

        $paginator = $query
            ->orderBy('priority')
            ->orderByDesc('at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (Todo $t) => [
                'todoId' => $t->todo_id,
                'title' => $t->title,
                'hint' => $t->hint,
                'tone' => $t->tone,
                'go' => $t->go,
                'priority' => $t->priority,
                'status' => $t->status,
                'at' => $t->at?->toIso8601String(),
            ])
            ->all();

        return [
            'openCount' => $openCount,
            'total' => $paginator->total(),
            'pageNum' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'list' => $list,
        ];
    }

    /**
     * isRead 过滤：0/1 或 true/false 均可
     */
    private function applyIsRead($query, array $filters): void
    {
        $isRead = $filters['isRead'] ?? null;
        if ($isRead === null || $isRead === '') {
            return;
        }

        $query->where('is_read', (bool) (int) $isRead);
    }
}
