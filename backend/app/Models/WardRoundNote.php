<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WardRoundNote extends Model
{
    protected $fillable = [
        'note_no', 'round_id', 'patient_id', 'kind', 'content', 'actor_id', 'actor_name', 'noted_at',
    ];

    protected $casts = [
        'noted_at' => 'datetime',
    ];

    public function round(): BelongsTo
    {
        return $this->belongsTo(WardRound::class, 'round_id', 'round_id');
    }
}
