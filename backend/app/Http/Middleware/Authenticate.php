<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // 本后端没有名为 login 的 web 路由：API/JSON 请求未认证时返回 null，
        // 让 Laravel 抛出标准的 401 JSON，而不是因 route('login') 不存在而 500。
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        return route('login');
    }
}
