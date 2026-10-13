<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultParticipant extends Model
{
    protected $fillable = [
        'session_id', 'role', 'name', 'online', 'device_type', 'join_mode', 'joined_at',
    ];

    protected $casts = [
        'online' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ConsultSession::class, 'session_id', 'session_id');
    }
}
