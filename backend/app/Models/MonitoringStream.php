<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonitoringStream extends Model
{
    protected $fillable = [
        'stream_id', 'name', 'kind', 'institution_id', 'department_id',
        'bed_id', 'bed_label', 'vehicle_id', 'online', 'ptz_enabled',
        'protocol', 'stream_url', 'fallback_url',
    ];

    protected $casts = [
        'online' => 'boolean',
        'ptz_enabled' => 'boolean',
    ];
}
