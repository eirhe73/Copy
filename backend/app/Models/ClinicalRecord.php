<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicalRecord extends BaseModel
{
    protected $fillable = [
        'record_code', 'patient_id', 'doctor_user_id', 'org_id', 'record_type',
        'chief_complaint', 'present_history', 'diagnosis', 'treatment', 'visit_at',
    ];

    protected $casts = [
        'visit_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成诊疗记录编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->record_code)) {
                $model->record_code = 'REC'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_user_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }
}
