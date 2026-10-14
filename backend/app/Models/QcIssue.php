<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QcIssue extends BaseModel
{
    protected $fillable = [
        'qc_code', 'issue_title', 'severity', 'issue_source', 'owner_user_id',
        'current_stage', 'qc_status', 'due_at', 'related_type', 'related_id',
        'supervise_target', 'check_method', 'check_item', 'check_result',
        'discovered_at', 'is_on_time_completed', 'event_id',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'discovered_at' => 'date',
        'is_on_time_completed' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    /**
     * 自动生成质控编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->qc_code)) {
                // 与种子数据格式一致：QC-{Ymd}-{三位序号}
                $prefix = 'QC-'.now()->format('Ymd').'-';
                $seq = static::withTrashed()->where('qc_code', 'like', $prefix.'%')->count() + 1;

                do {
                    $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
                    $seq++;
                } while (static::withTrashed()->where('qc_code', $code)->exists());

                $model->qc_code = $code;
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(EmergencyEvent::class, 'event_id');
    }
}
