<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleLocation extends Model
{
    /**
     * 表仅含 updated_at，无 created_at，故关闭自动时间戳
     */
    public $timestamps = false;

    protected $fillable = [
        'vehicle_id', 'lng', 'lat', 'speed_kmh', 'heading',
        'destination', 'eta_minutes', 'route', 'located_at',
    ];

    protected $casts = [
        'lng' => 'decimal:6',
        'lat' => 'decimal:6',
        'route' => 'array',
        'eta_minutes' => 'integer',
        'located_at' => 'datetime',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }
}
