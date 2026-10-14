<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | 跨域直连部署：前端与后端不同域名/端口，允许任意来源。
    | 前端使用 JWT Bearer Token（不带 Cookie），故 supports_credentials 置 false，
    | 这也使 allowed_origins 使用 '*' 合法（浏览器允许）。
    | 若后续改为同域反代（Nginx /backend-api -> Laravel /api），可无需 CORS。
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
