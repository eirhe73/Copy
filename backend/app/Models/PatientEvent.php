<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 患者临床时间轴事件（patient_events）
 */
class PatientEvent extends Model
{
    protected $table = 'patient_events';

    public $timestamps = false;

    protected $casts = [
        'at' => 'datetime',
        'scopes' => 'array',
        'user_ids' => 'array',
        'created_at' => 'datetime',
    ];
}
