<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 患者临床记录（clinical_notes）
 */
class ClinicalNote extends Model
{
    protected $table = 'clinical_notes';

    public $timestamps = false;

    protected $casts = [
        'at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
