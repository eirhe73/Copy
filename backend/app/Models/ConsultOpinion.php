<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultOpinion extends Model
{
    protected $fillable = [
        'opinion_no', 'session_id', 'content', 'doctor_id', 'doctor_name',
        'feedback', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ConsultSession::class, 'session_id', 'session_id');
    }
}
