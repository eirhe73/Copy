<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Exceptions\BusinessException;

/**
 * 业务服务基类：承载业务编排、事务与日志
 */
abstract class Service
{
    /**
     * 业务断言，条件不满足时抛出业务异常
     */
    protected function assert(bool $condition, ResponseCode $code, ?string $message = null): void
    {
        if (! $condition) {
            throw new BusinessException($code, $message);
        }
    }
}
