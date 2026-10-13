<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends BaseModel
{
    protected $fillable = [
        'plate_number', 'vehicle_type', 'org_id', 'vehicle_status',
        'driver_name', 'driver_phone', 'latest_lng', 'latest_lat', 'latest_at',
        'vehicle_id', 'bound_hospital', 'crew', 'status', 'current_event_id',
    ];

    protected $casts = [
        'latest_lng' => 'decimal:6',
        'latest_lat' => 'decimal:6',
        'latest_at' => 'datetime',
        'status' => 'integer',
        'is_deleted' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }

    public function tracks(): HasMany
    {
        return $this->hasMany(VehicleTrack::class, 'vehicle_id');
    }
}
