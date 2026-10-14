<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 会诊房间（consult_rooms，04-会诊协同 §4.1）
 */
class ConsultRoom extends Model
{
    protected $fillable = [
        'token', 'consult_code', 'session_id', 'patient_id', 'room_name',
        'media_mode', 'rtc_url', 'status', 'opened_at', 'closed_at',
    ];

    protected $casts = [
        'status' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ConsultSession::class, 'session_id', 'session_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ConsultMaterial::class, 'room_token', 'token');
    }

    public function opinions(): HasMany
    {
        return $this->hasMany(ConsultOpinion::class, 'room_token', 'token');
    }
}
