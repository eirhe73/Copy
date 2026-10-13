<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWardNoteRequest;
use App\Services\CriticalCareService;
use App\Support\Result;
use Illuminate\Http\Request;

class CriticalCareController extends Controller
{
    public function __construct(private readonly CriticalCareService $service)
    {
    }

    /** §3.1 ICU 床位态势 */
    public function beds(Request $request): array
    {
        return Result::success('获取成功', $this->service->beds($request->query()));
    }

    /** §3.2 远程查房列表 */
    public function wards(Request $request): array
    {
        return Result::success('获取成功', $this->service->wards($request->query()));
    }

    /** §3.3 床旁体征（实时） */
    public function vitals(Request $request): array
    {
        return Result::success('获取成功', $this->service->vitals($request->query()));
    }

    /** §3.4 智能预警（重症） */
    public function alerts(Request $request): array
    {
        return Result::success('获取成功', $this->service->alerts($request->query()));
    }

    /** §3.5 患者体征时序 */
    public function patientVitals(Request $request, string $id): array
    {
        return Result::success('获取成功', $this->service->patientVitals($id, $request->query()));
    }

    /** §3.6 写查房记录 */
    public function wardNote(StoreWardNoteRequest $request, string $id): array
    {
        return Result::success('提交成功', $this->service->wardNote($id, $request->validated()));
    }
}
