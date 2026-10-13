<?php

namespace App\Models;

/**
 * 质控整改单（qc_rectifies）
 */
class QcRectify extends BaseModel
{
    protected $fillable = [
        'rectify_id', 'title', 'description', 'source', 'level', 'status',
        'owner_name', 'owner_org', 'owner_dept', 'standard_id', 'rule_id',
        'found_at', 'deadline', 'closed_at', 'standard_gap', 'cause_category',
        'cause_analysis', 'measure', 'reviewer_name', 'role_view',
    ];

    protected $casts = [
        'level' => 'integer',
        'found_at' => 'datetime',
        'deadline' => 'datetime',
        'closed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成整改编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->rectify_id)) {
                $model->rectify_id = 'ZG'.now()->format('Ymd').str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            }
        });
    }
}
