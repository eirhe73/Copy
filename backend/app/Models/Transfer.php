<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 转运任务（transfers，03-患者与床位/03-转诊协同接口 §2.1）
 */
class Transfer extends BaseModel
{
    /** 方向：上转/下转 */
    public const DIRECTION_UP = 0;

    public const DIRECTION_DOWN = 1;

    /** 状态：0待接收1已接收2转运中3到院4已完成5已拒绝（§4.2） */
    public const STATUS_REQUESTED = 0;

    public const STATUS_ACCEPTED = 1;

    public const STATUS_IN_TRANSIT = 2;

    public const STATUS_ARRIVED = 3;

    public const STATUS_COMPLETED = 4;

    public const STATUS_REJECTED = 5;

    protected $fillable = [
        'transfer_id', 'patient_id', 'patient_name', 'direction',
        'source_institution_id', 'source_department_id', 'target_institution_id', 'target_department_id',
        'status', 'green_channel', 'channel_type', 'reason', 'transport_vehicle_id',
        'created_by', 'started_at', 'accepted_at', 'arrived_at', 'completed_at',
        'event_id', 'doctor_id', 'nurse_id',
    ];

    protected $casts = [
        'direction' => 'integer',
        'status' => 'integer',
        'green_channel' => 'boolean',
        'started_at' => 'datetime',
        'accepted_at' => 'datetime',
        'arrived_at' => 'datetime',
        'completed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    /**
     * 路由模型绑定使用业务编号 transfer_id（03-转诊协同 §3.4，路径参数 id = 转诊编号）
     */
    public function getRouteKeyName(): string
    {
        return 'transfer_id';
    }

    /**
     * 自动生成转诊编号
     */
    protected static function booted(): void
    {
        parent::booted();

        static::creating(function (self $model) {
            if (empty($model->transfer_id)) {
                $model->transfer_id = self::generateTransferId();
            }
        });
    }

    /**
     * 生成唯一转诊编号：TRF-YYYYMMDD-NNN
     */
    public static function generateTransferId(): string
    {
        $prefix = 'TRF-'.now()->format('Ymd').'-';
        $seq = (int) self::withTrashed()->where('transfer_id', 'like', $prefix.'%')->count();

        do {
            $seq++;
            $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        } while (self::withTrashed()->where('transfer_id', $code)->exists());

        return $code;
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'transport_vehicle_id', 'vehicle_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(EmergencyEvent::class, 'event_id');
    }
}
