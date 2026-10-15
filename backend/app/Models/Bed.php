<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bed extends Model
{
    protected $fillable = [
        'bed_id', 'label', 'institution_id', 'department_id', 'status',
        'patient_id', 'event_id', 'reserve_reason', 'reserved_until', 'enabled',
    ];

    protected $casts = [
        'status' => 'integer',
        'reserved_until' => 'datetime',
        'enabled' => 'boolean',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(EmergencyEvent::class, 'event_id', 'event_code');
    }
}
