<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'notification_id', 'title', 'text', 'is_read', 'patient_name', 'channel', 'token', 'at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'at' => 'datetime',
    ];
}
