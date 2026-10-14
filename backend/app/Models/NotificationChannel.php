<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 通知渠道配置（notification_channels）
 */
class NotificationChannel extends Model
{
    protected $fillable = [
        'channel_id', 'channel', 'name', 'enabled', 'config', 'sort',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'config' => 'array',
        'sort' => 'integer',
    ];
}
