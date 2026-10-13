<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RectifyTransitionRequest;
use App\Models\QcRectify;
use App\Services\RectifyService;
use App\Support\Result;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RectifyController extends Controller
{
    public function __construct(private readonly RectifyService $service)
    {
    }

    /**
     * §5.4 整改台账
     */
    public function ledger(Request $request): array
    {
        return Result::success('获取成功', $this->service->ledger($request->query()));
    }

    /**
     * §5.5 整改单详情
     */
    public function show(string $rectify): array
    {
        return Result::success('获取成功', $this->service->detail($rectify));
    }

    /**
     * §5.6 整改销号（闭环流转）
     */
    public function close(RectifyTransitionRequest $request, string $rectify): array
    {
        return Result::success('流转成功', $this->service->transition($rectify, $request->validated()));
    }

    /**
     * §5.7 质控报表
     */
    public function reports(Request $request): array
    {
        return Result::success('获取成功', $this->service->reports($request->query()));
    }

    /**
     * §5.8 导出质控整改台账 CSV
     */
    public function export(Request $request): StreamedResponse
    {
        $headers = ['整改编号', '问题标题', '问题来源', '级别', '状态', '责任人', '所属机构', '科室', '发现时间', '整改期限', '销号时间', '是否超期', '差距分析', '原因分类', '原因分析', '整改措施'];

        return response()->streamDownload(function () use ($headers, $request) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);

            $this->service->filteredQuery($request->query())
                ->orderByDesc('found_at')
                ->chunk(200, function ($rows) use ($out) {
                    foreach ($rows as $r) {
                        fputcsv($out, [
                            $r->rectify_id,
                            $r->title,
                            $r->source,
                            $r->level,
                            $r->status,
                            $r->owner_name,
                            $r->owner_org,
                            $r->owner_dept,
                            $r->found_at?->toDateTimeString(),
                            $r->deadline?->toDateTimeString(),
                            $r->closed_at?->toDateTimeString(),
                            ($r->status !== 'closed' && $r->deadline !== null && $r->deadline->lt(now())) ? '是' : '否',
                            $r->standard_gap,
                            $r->cause_category,
                            $r->cause_analysis,
                            $r->measure,
                        ]);
                    }
                });

            fclose($out);
        }, '质控整改台账_'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
