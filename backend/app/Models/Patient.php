<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends BaseModel
{
    protected $fillable = [
        'patient_code', 'real_name', 'gender', 'birth_date', 'age',
        'id_card', 'phone', 'address', 'medical_history', 'allergy_history',
        'prehospital', 'is_draft', 'entry', 'stage',
        'source_record_id', 'institution_id', 'department_id',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'prehospital' => 'array',
        'is_draft' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成患者编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->patient_code)) {
                $model->patient_code = 'PAT'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function emergencyEvents(): HasMany
    {
        return $this->hasMany(EmergencyEvent::class, 'patient_id');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'patient_id');
    }
}
