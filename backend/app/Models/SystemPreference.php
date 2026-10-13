<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 系统偏好配置（system_preferences）：(user_id, pref_key) 键值
 */
class SystemPreference extends Model
{
    protected $fillable = [
        'user_id', 'pref_key', 'pref_value',
    ];

    protected $casts = [
        'pref_value' => 'array',
    ];
}
