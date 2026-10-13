<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 基层反馈 / 问题上报（dr_posts）
 */
class DrPost extends Model
{
    protected $fillable = [
        'post_id', 'category', 'title', 'content', 'institution_id', 'institution_name',
        'department', 'reporter_id', 'reporter_name', 'contact', 'priority', 'status',
        'reply', 'replied_by', 'replied_at', 'attachments',
    ];

    protected $casts = [
        'priority' => 'integer',
        'attachments' => 'array',
        'replied_at' => 'datetime',
    ];

    /**
     * 自动生成反馈/问题业务编号
     */
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->post_id)) {
                $model->post_id = 'DR-POST-'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
