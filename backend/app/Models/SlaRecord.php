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
     * 路由键使用业务编号（与 patients/transfers 惯例一致）
     */
    public function getRouteKeyName(): string
    {
        return 'sla_code';
    }

    /**
     * 自动生成时限记录编号：SLA-{Ymd}-{三位序号}
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->sla_code)) {
                $prefix = 'SLA-'.now()->format('Ymd').'-';
                $seq = static::withTrashed()->where('sla_code', 'like', $prefix.'%')->count() + 1;

                do {
                    $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
                    $seq++;
                } while (static::withTrashed()->where('sla_code', $code)->exists());

                $model->sla_code = $code;
            }
        });
    }
}
