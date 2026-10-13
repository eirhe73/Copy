<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultMaterial extends Model
{
    protected $fillable = [
        'material_no', 'session_id', 'kind', 'title', 'content',
        'source', 'author_name', 'shared_at',
    ];

    protected $casts = [
        'shared_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ConsultSession::class, 'session_id', 'session_id');
    }
}
