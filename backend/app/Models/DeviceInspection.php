<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceInspection extends Model
{
    protected $fillable = [
        'inspection_id', 'device_id', 'item', 'result', 'inspector', 'check_at', 'note',
    ];

    protected $casts = [
        'check_at' => 'datetime',
    ];
}
