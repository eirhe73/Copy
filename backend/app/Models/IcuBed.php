<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IcuBed extends Model
{
    protected $fillable = [
        'bed_id', 'label', 'institution_id', 'department_id', 'status',
        'patient_id', 'patient_name', 'severity', 'monitor_id', 'admitted_at',
    ];

    protected $casts = [
        'admitted_at' => 'datetime',
    ];
}
