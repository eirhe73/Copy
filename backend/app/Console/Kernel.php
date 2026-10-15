<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // 远程会诊房间兜底对账：会诊系统单向依赖、不反向回调，队列页/详情页无人访问时
        // 靠这里把已在会诊系统侧结束（房间 state=ENDED）的会诊单收口为"已结束"。
        // 生效前提：服务器 cron 每分钟执行一次 `php artisan schedule:run`。
        $schedule->command('consult:reconcile')
            ->everyFiveMinutes()
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
