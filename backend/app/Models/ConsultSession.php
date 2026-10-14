<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ConsultSession extends Model
{
    protected $fillable = [
        'session_id', 'token', 'consult_code', 'mode', 'compatible120',
        'patient_id', 'patient_name', 'patient_gender', 'patient_age', 'chief_complaint',
        'task120_id', 'source_hospital', 'source_department', 'hospital', 'department',
        'nominated_doctor_id', 'accepted_by', 'accepted_by_name',
        'accepted_at', 'opened_at', 'closed_at', 'note', 'status', 'scheduled_at',
    ];

    protected $casts = [
        'compatible120' => 'boolean',
        'accepted_at' => 'datetime',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    public function room(): HasOne
    {
        return $this->hasOne(ConsultRoom::class, 'session_id', 'session_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConsultParticipant::class, 'session_id', 'session_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ConsultMaterial::class, 'session_id', 'session_id');
    }

    public function opinions(): HasMany
    {
        return $this->hasMany(ConsultOpinion::class, 'session_id', 'session_id');
    }
}
