<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferMilestone extends Model
{
    protected $fillable = [
        'transfer_no', 'milestone_key', 'milestone_label', 'occurred_at', 'actor',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];
}
