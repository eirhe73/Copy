<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleTrack extends Model
{
    protected $fillable = [
        'vehicle_id', 'event_id', 'lng', 'lat', 'speed', 'heading', 'recorded_at',
    ];

    protected $casts = [
        'lng' => 'decimal:6',
        'lat' => 'decimal:6',
        'speed' => 'decimal:2',
        'heading' => 'decimal:1',
        'recorded_at' => 'datetime',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }
}
