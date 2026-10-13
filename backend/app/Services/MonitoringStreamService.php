<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\MonitoringStream;
use Illuminate\Support\Str;

/**
 * 远程监控流台账与云台控制
 */
class MonitoringStreamService extends Service
{
    /**
     * 监控流列表（§3.4）
     */
    public function index(array $filters): array
    {
        $query = MonitoringStream::query();

        $query->when(! empty($filters['kind']), fn ($q) => $q->where('kind', $filters['kind']))
            ->when(! empty($filters['institutionId']), fn ($q) => $q->where('institution_id', $filters['institutionId']))
            ->when(! empty($filters['onlineOnly']), fn ($q) => $q->where('online', true));

        $streams = $query->orderBy('stream_id')->get();

        return [
            'updatedAt' => now()->toIso8601String(),
            'total' => $streams->count(),
            'list' => $streams->map(fn (MonitoringStream $stream) => $this->summary($stream))->values()->all(),
        ];
    }

    /**
     * 单路监控画面（§3.5）
     */
    public function detail(string $streamId): array
    {
        $stream = MonitoringStream::query()->where('stream_id', $streamId)->first();
        $this->assert($stream !== null, ResponseCode::NOT_FOUND, '监控流不存在');
        $this->assert((bool) $stream->online, ResponseCode::SERVICE_UNAVAILABLE, '摄像头离线，拉流不可用');

        return [
            'streamId' => $stream->stream_id,
            'name' => $stream->name,
            'kind' => $stream->kind,
            'online' => (bool) $stream->online,
            'ptzEnabled' => (bool) $stream->ptz_enabled,
            'protocol' => $stream->protocol,
            'streamUrl' => $stream->stream_url,
            'playToken' => Str::random(48),
            'expiresAt' => now()->addMinutes(10)->toIso8601String(),
            'fallback' => [
                'protocol' => 'flv',
                'streamUrl' => $stream->fallback_url,
            ],
        ];
    }

    /**
     * 云台控制（§3.6）
     */
    public function ptz(array $data): array
    {
        $stream = MonitoringStream::query()->where('stream_id', $data['streamId'])->first();
        $this->assert($stream !== null, ResponseCode::NOT_FOUND, '监控流不存在');
        $this->assert((bool) $stream->ptz_enabled, ResponseCode::CONFLICT, '该监控流不支持云台控制');

        return [
            'streamId' => $stream->stream_id,
            'action' => $data['action'],
            'accepted' => true,
        ];
    }

    /**
     * 列表项字段
     */
    private function summary(MonitoringStream $stream): array
    {
        return [
            'streamId' => $stream->stream_id,
            'name' => $stream->name,
            'kind' => $stream->kind,
            'institutionId' => $stream->institution_id,
            'departmentId' => $stream->department_id,
            'bedId' => $stream->bed_id,
            'bedLabel' => $stream->bed_label,
            'vehicleId' => $stream->vehicle_id,
            'online' => (bool) $stream->online,
            'ptzEnabled' => (bool) $stream->ptz_enabled,
        ];
    }
}
