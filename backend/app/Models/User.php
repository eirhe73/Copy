<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $fillable = [
        'org_id', 'real_name', 'username', 'password_hash', 'phone', 'email',
        'identity_type', 'home_route', 'user_status', 'last_login_at', 'last_login_ip',
    ];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'last_login_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    /**
     * 密码字段为 password_hash，适配原表结构
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }

    protected static function booted(): void
    {
        static::deleted(function (self $model) {
            if (! $model->isForceDeleting()) {
                $model->newQueryWithoutScopes()
                    ->where($model->getKeyName(), $model->getKey())
                    ->update(['is_deleted' => true]);
            }
        });
    }
}
