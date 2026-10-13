<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultOpinion extends Model
{
    /**
     * 表仅含 created_at（无 updated_at）
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'room_token', 'session_id', 'doctor_id', 'doctor_name',
        'content', 'feedback', 'submitted_at',
    ];

    protected $casts = [
        'feedback' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(ConsultRoom::class, 'room_token', 'token');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ConsultSession::class, 'session_id', 'session_id');
    }
}
