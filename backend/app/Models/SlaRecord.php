<?php

namespace App\Models;

class SlaRecord extends BaseModel
{
    protected $fillable = [
        'sla_code', 'kind', 'rule_id', 'subject', 'owner', 'role_view',
        'started_at', 'arrived_at', 'limit_minutes', 'used_minutes', 'overtime',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'arrived_at' => 'datetime',
        'overtime' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成时限记录编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->sla_code)) {
                $model->sla_code = 'SLA'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
