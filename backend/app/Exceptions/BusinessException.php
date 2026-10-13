<?php

namespace App\Exceptions;

use App\Enums\ResponseCode;
use Exception;

/**
 * 业务异常：由 Service/Controller 主动抛出，统一被 Handler 渲染为 {code,message,data}
 */
class BusinessException extends Exception
{
    protected ResponseCode $responseCode;

    protected mixed $data;

    public function __construct(ResponseCode $responseCode, ?string $message = null, mixed $data = null)
    {
        $this->responseCode = $responseCode;
        $this->data = $data;
        parent::__construct($message ?? $responseCode->message());
    }

    public function responseCode(): ResponseCode
    {
        return $this->responseCode;
    }

    public function data(): mixed
    {
        return $this->data;
    }
}
