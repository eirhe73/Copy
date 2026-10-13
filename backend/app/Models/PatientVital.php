<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientVital extends Model
{
    protected $fillable = [
        'patient_id', 'heart_rate', 'spo2', 'resp', 'temp',
        'systolic', 'diastolic', 'news', 'source', 'measured_at',
    ];

    protected $casts = [
        'temp' => 'decimal:1',
        'measured_at' => 'datetime',
    ];
}
