<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventTimeline extends Model
{
    protected $fillable = [
        'event_id', 'node_type', 'node_title', 'content', 'occurred_at', 'operator_user_id',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(EmergencyEvent::class, 'event_id');
    }
}
