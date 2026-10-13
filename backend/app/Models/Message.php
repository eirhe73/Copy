<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'message_id', 'title', 'text', 'is_read', 'patient_id',
        'patient_name', 'category', 'link', 'at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'at' => 'datetime',
    ];
}
