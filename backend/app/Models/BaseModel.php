<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 项目基类模型：软删除使用 deleted_at，同时同步 is_deleted 标记
 */
abstract class BaseModel extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::deleted(function (self $model) {
            if (! $model->isForceDeleting()) {
                $model->newQueryWithoutScopes()
                    ->where($model->getKeyName(), $model->getKey())
                    ->update(['is_deleted' => true]);
                $model->is_deleted = true;
            }
        });

        static::restored(function (self $model) {
            $model->newQueryWithoutScopes()
                ->where($model->getKeyName(), $model->getKey())
                ->update(['is_deleted' => false]);
            $model->is_deleted = false;
        });
    }
}
