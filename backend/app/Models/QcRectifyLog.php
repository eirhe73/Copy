<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 质控整改流转日志（qc_rectify_logs）
 */
class QcRectifyLog extends Model
{
    protected $fillable = [
        'rectify_id', 'action', 'operator', 'remark', 'at',
    ];

    protected $casts = [
        'at' => 'datetime',
    ];
}
