<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 协作消息（dr_messages）
 */
class DrMessage extends Model
{
    protected $fillable = [
        'message_id', 'thread_id', 'institution_id', 'institution_name',
        'sender_id', 'sender_name', 'kind', 'content', 'media_url', 'duration_sec', 'is_read',
    ];

    // dr_messages 仅含 created_at（§2.2），无 updated_at
    public const UPDATED_AT = null;

    protected $casts = [
        'kind' => 'integer',
        'duration_sec' => 'integer',
        'is_read' => 'boolean',
    ];

    /**
     * 自动生成消息编号
     */
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->message_id)) {
                $model->message_id = 'DR-MSG-'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
