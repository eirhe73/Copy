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
            // 按登录态限流：带 Token 按用户维度，未登录（如 login/health）按 IP；
            // 额度放宽到 300 次/分钟，避免大屏多面板并发拉数据触发 429。
            // 注：限流中间件先于 auth:api 执行，此时 $request->user() 尚未解析，
            //     故此处不能依赖 user()，需从 Bearer Token 自行识别用户。
            $key = $request->bearerToken()
                ? 'user:'.hash('sha256', $request->bearerToken())
                : $request->ip();

            return Limit::perMinute(300)->by($key);
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
