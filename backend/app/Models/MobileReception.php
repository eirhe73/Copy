<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 手机重症接收单（mobile_receptions）
 */
class MobileReception extends Model
{
    protected $fillable = [
        'reception_id', 'token', 'journey_id', 'patient_id', 'patient_name',
        'gender', 'age', 'phone', 'source_institution_id', 'source_department_id',
        'category', 'complaint', 'symptoms', 'accepted_institution_id',
        'accepted_department_id', 'accepted_by', 'status', 'prep_checklist', 'accepted_at',
    ];

    protected $casts = [
        'age' => 'integer',
        'symptoms' => 'array',
        'prep_checklist' => 'array',
        'accepted_at' => 'datetime',
    ];
}
