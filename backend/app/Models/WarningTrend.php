<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarningTrend extends Model
{
    protected $fillable = [
        'trend_id', 'patient_label', 'metric', 'current_value',
        'predicted_value', 'within_minutes', 'note',
    ];

    protected $casts = [
        'current_value' => 'decimal:2',
        'predicted_value' => 'decimal:2',
        'within_minutes' => 'integer',
    ];
}
