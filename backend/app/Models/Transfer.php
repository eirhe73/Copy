<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transfer extends BaseModel
{
    protected $fillable = [
        'transfer_code', 'event_id', 'patient_id', 'from_org_id', 'to_org_id',
        'urgency_level', 'transfer_reason', 'diagnosis', 'trigger_source',
        'transfer_status', 'confirm_status', 'confirmed_at', 'confirmed_by_user_id',
        'reject_reason', 'review_note', 'vehicle_id', 'driver_name', 'eta',
        'latest_vitals', 'resource_prep', 'handover_status', 'initiator_user_id',
        'from_institution_id', 'to_institution_id', 'doctor_id', 'nurse_id',
        'started_at', 'arrived_at', 'handover_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
        'eta' => 'datetime',
        'started_at' => 'datetime',
        'arrived_at' => 'datetime',
        'handover_at' => 'datetime',
        'latest_vitals' => 'array',
        'resource_prep' => 'array',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成转诊单号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->transfer_code)) {
                $model->transfer_code = 'TRA'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(EmergencyEvent::class, 'event_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function fromOrg(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'from_org_id');
    }

    public function toOrg(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'to_org_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }
}
