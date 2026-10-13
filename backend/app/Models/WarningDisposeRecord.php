<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarningDisposeRecord extends Model
{
    protected $fillable = [
        'warning_id', 'warning_no', 'stage', 'note', 'actor_id', 'actor_name', 'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    public function warning(): BelongsTo
    {
        return $this->belongsTo(Warning::class, 'warning_id', 'id');
    }
}
