<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareBinding extends Model
{
    protected $fillable = [
        'scope', 'hospital', 'ward', 'bed_id', 'bed_label',
        'patient_id', 'patient_name', 'device_id', 'device_name', 'camera_id', 'bound_at',
    ];

    protected $casts = [
        'scope' => 'integer',
        'bound_at' => 'datetime',
    ];
}
