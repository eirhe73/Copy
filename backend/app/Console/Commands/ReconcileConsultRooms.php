<?php

namespace App\Console\Commands;

use App\Services\ConsultationService;
use Illuminate\Console\Command;

/**
 * 会诊房间兜底对账
 *
 * 远程会诊系统是单向依赖、不反向回调主系统的，主系统只能在读队列/详情时探活对账。
 * 会诊室是另开标签页打开的，房主在那边点"结束"后若长时间没人打开主系统队列，
 * 会诊单状态会一直停在"待接诊/会诊中"。本命令按固定周期兜底跑一次对账，
 * 把已在会诊系统侧结束（房间 state=ENDED）的会诊单收口为"已结束"，
 * 保证统计与质控口径与会诊系统一致。
 *
 * 需在服务器配 cron 执行 `php artisan schedule:run` 才会按周期跑（见 app/Console/Kernel.php）。
 */
class ReconcileConsultRooms extends Command
{
    protected $signature = 'consult:reconcile
                            {--limit=30 : 单次对账的候选会诊单上限（上限内的房间并行探活）}';

    protected $description = '兜底对账远程会诊房间状态：把已在会诊系统侧结束的会诊单收口为已结束';

    public function handle(ConsultationService $consultations): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $closed = $consultations->reconcilePending($limit);

        $this->info("会诊状态对账完成，本次收口 {$closed} 单");

        return self::SUCCESS;
    }
}
