<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalDevice extends Model
{
    protected $fillable = [
        'device_id', 'name', 'bed_id', 'bed_label', 'patient_id', 'patient_name',
        'online', 'alarm', 'bound_at', 'previous_bed_id', 'unbound_at',
    ];

    protected $casts = [
        'online' => 'boolean',
        'alarm' => 'boolean',
        'bound_at' => 'datetime',
        'unbound_at' => 'datetime',
    ];
}
