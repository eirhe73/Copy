<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Handover extends Model
{
    protected $fillable = [
        'handover_no', 'transfer_no', 'event_id', 'task120_id', 'patient_id', 'patient_name',
        'from_staff_id', 'from_staff_name', 'to_staff_id', 'to_staff_name', 'to_dept',
        'items', 'signature', 'handover_at',
    ];

    protected $casts = [
        'items' => 'array',
        'handover_at' => 'datetime',
    ];
}
