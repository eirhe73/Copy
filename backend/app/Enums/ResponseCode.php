<?php

namespace App\Enums;

/**
 * 统一业务响应码
 */
enum ResponseCode: int
{
    case SUCCESS = 200;
    case BAD_REQUEST = 400;
    case UNAUTHORIZED = 401;
    case FORBIDDEN = 403;
    case NOT_FOUND = 404;
    case CONFLICT = 409;
    case UNPROCESSABLE = 422;
    case SERVER_ERROR = 500;
    case SERVICE_UNAVAILABLE = 503;

    public function message(): string
    {
        return match ($this) {
            self::SUCCESS => 'success',
            self::BAD_REQUEST => '请求参数有误',
            self::UNAUTHORIZED => '未认证或登录已失效',
            self::FORBIDDEN => '无权限执行该操作',
            self::NOT_FOUND => '资源不存在',
            self::CONFLICT => '操作冲突，请刷新后重试',
            self::UNPROCESSABLE => '请求无法处理',
            self::SERVER_ERROR => '服务器内部错误',
            self::SERVICE_UNAVAILABLE => '服务暂不可用',
        };
    }
}
