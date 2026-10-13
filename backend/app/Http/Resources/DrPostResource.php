<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrPostResource extends JsonResource
{
    private const CATEGORY_LABELS = ['FEEDBACK' => '基层反馈', 'ISSUE' => '问题上报'];

    private const STATUS_LABELS = ['PENDING' => '待处理', 'REPLIED' => '已回复', 'RESOLVED' => '已办结'];

    private const PRIORITY_LABELS = [0 => '普通', 1 => '紧急'];

    public function toArray(Request $request): array
    {
        return [
            'postId' => $this->post_id,
            'category' => $this->category,
            'categoryLabel' => self::CATEGORY_LABELS[$this->category] ?? $this->category,
            'title' => $this->title,
            'content' => $this->content,
            'institutionId' => $this->institution_id,
            'institutionName' => $this->institution_name,
            'department' => $this->department,
            'reporterId' => $this->reporter_id,
            'reporterName' => $this->reporter_name,
            'contact' => $this->contact,
            'priority' => (int) $this->priority,
            'priorityLabel' => self::PRIORITY_LABELS[$this->priority] ?? (string) $this->priority,
            'status' => $this->status,
            'statusLabel' => self::STATUS_LABELS[$this->status] ?? $this->status,
            'reply' => $this->reply,
            'repliedAt' => $this->replied_at?->toIso8601String(),
            'attachments' => $this->attachments,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
