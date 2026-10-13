<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareCenterProfile extends Model
{
    protected $fillable = [
        'center_id', 'org_id', 'visible_patients', 'pending_transfer', 'team_size',
        'equipment', 'annual_volume', 'pathway_rate', 'assessment_note', 'profiled_at',
    ];

    protected $casts = [
        'equipment' => 'array',
        'pathway_rate' => 'decimal:4',
        'profiled_at' => 'datetime',
    ];
}
