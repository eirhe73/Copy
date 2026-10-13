<?php

namespace App\Support;

use App\Enums\ResponseCode;

/**
 * 统一响应体构造：{code, message, data}
 */
class Result
{
    public static function success(?string $message = null, mixed $data = null): array
    {
        return [
            'code' => ResponseCode::SUCCESS->value,
            'message' => $message ?? ResponseCode::SUCCESS->message(),
            'data' => $data,
        ];
    }

    public static function error(ResponseCode $code, ?string $message = null, mixed $data = null): array
    {
        return [
            'code' => $code->value,
            'message' => $message ?? $code->message(),
            'data' => $data,
        ];
    }
}
