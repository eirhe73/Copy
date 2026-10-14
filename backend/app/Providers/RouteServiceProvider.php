<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            $config = config('rate-limit.api');
            $limit = (int) ($config['limit'] ?? 300);

            // 限流维度：by=ip 时统一按客户端 IP；否则按登录态（带 Token 按用户，未登录回退 IP）。
            // 注：限流中间件先于 auth:api 执行，此时 $request->user() 尚未解析，
            //     故不能依赖 user()，需从 Bearer Token 自行识别用户。
            if (($config['by'] ?? 'token') === 'ip') {
                return Limit::perMinute($limit)->by($request->ip());
            }

            $key = $request->bearerToken()
                ? 'user:'.hash('sha256', $request->bearerToken())
                : $request->ip();

            return Limit::perMinute($limit)->by($key);
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
