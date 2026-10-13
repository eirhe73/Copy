<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyPatient extends Model
{
    protected $fillable = [
        'patient_no', 'event_id', 'task120_id', 'vehicle_id', 'vehicle_plate',
        'name', 'gender', 'age', 'phone', 'chief_complaint', 'is_draft',
    ];

    protected $casts = [
        'is_draft' => 'boolean',
        'gender' => 'integer',
        'age' => 'integer',
    ];
}
