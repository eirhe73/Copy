<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ResponseCode;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\NotificationChannel;
use App\Models\SystemPreference;
use App\Support\Result;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /** 全局默认偏好（无记录时回退） */
    private const DEFAULT_PREFS = [
        'theme' => 'light',
        'locale' => 'zh-CN',
        'notification' => ['tone' => 'warn', 'wechat' => true, 'sms' => false, 'inapp' => true],
        'listDensity' => 'comfortable',
    ];

    /**
     * §3.1 演示数据重置（仅 director）
     */
    public function demoReset(Request $request): array
    {
        if (($request->user()->role_view ?? '') !== 'director') {
            throw new BusinessException(ResponseCode::FORBIDDEN, '无重置权限（仅 director）');
        }

        // 演示数据存于前端 scenario.json，后端无落库，返回空计数占位
        return Result::success('重置成功', [
            'resetAt' => now()->toIso8601String(),
            'counts' => [
                'patients' => 0,
                'staff' => 0,
                'beds' => 0,
                'events' => 0,
                'mobile' => ['journeys' => 0, 'dispatches' => 0, 'consultationRequests' => 0],
            ],
        ]);
    }

    /**
     * §3.2 通知渠道（渠道配置）
     */
    public function notificationChannels(): array
    {
        $channels = NotificationChannel::query()->orderBy('sort')->get()
            ->map(fn (NotificationChannel $c) => [
                'channelId' => $c->channel_id,
                'channel' => $c->channel,
                'name' => $c->name,
                'enabled' => (bool) $c->enabled,
                'config' => $c->config,
                'sort' => (int) $c->sort,
            ])->values()->all();

        return Result::success('获取成功', ['updatedAt' => now()->toIso8601String(), 'list' => $channels]);
    }

    /**
     * §3.3 读取偏好（当前用户 + 全局默认合并）
     */
    public function preferences(Request $request): array
    {
        return Result::success('获取成功', $this->loadPrefs($request->user()->username));
    }

    /**
     * §3.4 更新偏好（增量 upsert，notification 子键合并）
     */
    public function updatePreferences(Request $request): array
    {
        $data = $request->validate([
            'theme' => ['nullable', 'string', 'in:light,dark'],
            'locale' => ['nullable', 'string', 'max:16'],
            'notification' => ['nullable', 'array'],
            'listDensity' => ['nullable', 'string', 'in:comfortable,compact'],
        ]);

        $userId = $request->user()->username;

        foreach ($data as $key => $value) {
            if ($value === null) {
                continue;
            }

            if ($key === 'notification') {
                $existing = SystemPreference::query()
                    ->where('user_id', $userId)->where('pref_key', 'notification')->value('pref_value');
                $value = array_merge(is_array($existing) ? $existing : [], $value);
            }

            SystemPreference::updateOrCreate(
                ['user_id' => $userId, 'pref_key' => $key],
                ['pref_value' => $value]
            );
        }

        return Result::success('保存成功', $this->loadPrefs($userId));
    }

    /**
     * 偏好合并：默认 → 全局(user_id='') → 当前用户
     */
    private function loadPrefs(string $userId): array
    {
        $merged = self::DEFAULT_PREFS;

        SystemPreference::query()
            ->whereIn('user_id', ['', $userId])
            ->orderBy('user_id')
            ->get()
            ->each(function (SystemPreference $p) use (&$merged) {
                $merged[$p->pref_key] = $p->pref_value;
            });

        $merged['updatedAt'] = now()->toIso8601String();

        return $merged;
    }
}
