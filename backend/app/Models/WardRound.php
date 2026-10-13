<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WardRound extends Model
{
    protected $fillable = [
        'round_id', 'ward_id', 'ward_label', 'institution_id', 'department_id',
        'patient_id', 'patient_label', 'title', 'doctor_id', 'doctor_name', 'participants',
        'status', 'planned_at', 'started_at', 'finished_at', 'summary',
    ];

    protected $casts = [
        'planned_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function notes(): HasMany
    {
        return $this->hasMany(WardRoundNote::class, 'round_id', 'round_id');
    }
}
