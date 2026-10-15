<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | 远程会诊系统（音视频能力）
    |--------------------------------------------------------------------------
    |
    | base_url      会诊系统后端地址，服务端直连，不经过浏览器
    | service_token 服务间静态令牌，双方一致，仅存环境变量
    | join_base_url 会诊系统前端地址，用于拼装医生入会链接
    | timeout       单次调用超时（秒），超时即降级，不阻断会诊业务
    |
    */

    'consultation' => [
        'base_url' => env('CONSULT_RTC_BASE_URL', ''),
        'service_token' => env('CONSULT_RTC_SERVICE_TOKEN', ''),
        'join_base_url' => env('CONSULT_RTC_JOIN_BASE_URL', ''),
        'timeout' => (int) env('CONSULT_RTC_TIMEOUT', 3),
        // 批量探活（队列对账）专用超时，调短避免队列请求被跨系统拖慢
        'probe_timeout' => (int) env('CONSULT_RTC_PROBE_TIMEOUT', 2),
        'enabled' => (bool) env('CONSULT_RTC_ENABLED', false),
        // 患者姓名在会诊系统侧是否脱敏。false = 直接显示姓名（当前院方确认口径）
        'name_masked' => (bool) env('CONSULT_RTC_NAME_MASKED', false),
    ],

];
