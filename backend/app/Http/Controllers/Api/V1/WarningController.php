<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DisposeWarningRequest;
use App\Services\WarningService;
use App\Support\Result;
use Illuminate\Http\Request;

class WarningController extends Controller
{
    public function __construct(private readonly WarningService $service) {}

    public function summary(Request $request): array
    {
        return Result::success('获取成功', $this->service->summary($request->query()));
    }

    public function index(Request $request): array
    {
        return Result::success('获取成功', $this->service->paginate($request->query()));
    }

    public function show(string $id): array
    {
        return Result::success('获取成功', $this->service->detail($id));
    }

    public function dispose(DisposeWarningRequest $request, string $id): array
    {
        return Result::success('处置成功', $this->service->dispose($id, $request->validated()));
    }

    public function statistics(Request $request): array
    {
        return Result::success('获取成功', $this->service->statistics($request->query()));
    }

    public function criticalValues(Request $request): array
    {
        return Result::success('获取成功', $this->service->criticalValues($request->query()));
    }

    public function closedLoop(Request $request): array
    {
        return Result::success('获取成功', $this->service->closedLoop($request->query()));
    }
}
