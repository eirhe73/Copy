<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrMessageResource extends JsonResource
{
    private const KIND_LABELS = ['TEXT' => '文字', 'VOICE' => '语音', 'IMAGE' => '图片', 'FILE' => '文件'];

    public function toArray(Request $request): array
    {
        return [
            'messageId' => $this->message_id,
            'threadId' => $this->thread_id,
            'institutionId' => $this->institution_id,
            'institutionName' => $this->institution_name,
            'senderId' => $this->sender_id,
            'senderName' => $this->sender_name,
            'kind' => $this->kind,
            'kindLabel' => self::KIND_LABELS[$this->kind] ?? $this->kind,
            'content' => $this->content,
            'mediaUrl' => $this->media_url,
            'durationSec' => (int) $this->duration_sec,
            'isRead' => (bool) $this->is_read,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
