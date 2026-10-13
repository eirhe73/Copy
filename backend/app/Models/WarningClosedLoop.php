<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarningClosedLoop extends Model
{
    /**
     * 表名为单数形式，需显式指定
     */
    protected $table = 'warning_closed_loop';

    protected $fillable = [
        'stage', 'count', 'stat_date',
    ];

    protected $casts = [
        'count' => 'integer',
        'stat_date' => 'date',
    ];
}
