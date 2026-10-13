<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 质控标准（按版本维护，无软删除）
 */
class QcStandard extends Model
{
    protected $fillable = [
        'version', 'standard_name', 'category', 'target_rate', 'sort', 'is_active',
    ];

    protected $casts = [
        'target_rate' => 'float',
        'is_active' => 'boolean',
    ];
}
