<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\DashboardLayout;
use Illuminate\Support\Facades\DB;

/**
 * 指挥大屏看板布局偏好（§3.6~3.7）：三级回退读取与乐观锁保存
 */
class DashboardLayoutService extends Service
{
    /** 未配置时的全局默认布局 */
    private const DEFAULT_LAYOUT = [
        'panels' => [
            ['key' => 'map', 'title' => '县域地图', 'visible' => true, 'order' => 1, 'span' => 8, 'locked' => false],
            ['key' => 'dispatch', 'title' => '急救调度概览', 'visible' => true, 'order' => 2, 'span' => 4, 'locked' => false],
            ['key' => 'eventStream', 'title' => '实时事件流', 'visible' => true, 'order' => 3, 'span' => 4, 'locked' => false],
            ['key' => 'kpi', 'title' => 'KPI 指标墙', 'visible' => true, 'order' => 4, 'span' => 8, 'locked' => false],
        ],
        'fullscreen' => false,
        'theme' => 'light',
    ];

    /**
     * §3.6 读取布局：显式 scope 直取，缺省按 user → role → default 回退
     */
    public function read(?string $scope): array
    {
        $user = auth()->user();

        if ($scope === 'role') {
            $row = $this->find('role', $this->roleKey($user), null);

            return $this->present($row, 'role');
        }

        if ($scope === 'default') {
            return $this->present($this->find('default', null, null), 'default');
        }

        if ($scope === 'user') {
            return $this->present($this->find('user', null, $user?->id), 'user');
        }

        $row = $this->find('user', null, $user?->id)
            ?? $this->find('role', $this->roleKey($user), null)
            ?? $this->find('default', null, null);

        return $this->present($row, $row?->scope ?? 'default');
    }

    /**
     * §3.7 保存布局：version 落后于服务端时返回 409
     */
    public function save(array $data): array
    {
        $scope = $data['scope'] ?? 'user';
        $owner = $this->owner($scope);

        return DB::transaction(function () use ($scope, $owner, $data) {
            $current = DashboardLayout::query()
                ->where('scope', $scope)
                ->where('role_key', $owner['role_key'])
                ->where('user_id', $owner['user_id'])
                ->lockForUpdate()
                ->first();

            if ($current === null) {
                $row = DashboardLayout::create([
                    'scope' => $scope,
                    'role_key' => $owner['role_key'],
                    'user_id' => $owner['user_id'],
                    'layout' => $data['layout'],
                    'version' => 1,
                ]);

                return ['scope' => $row->scope, 'version' => $row->version];
            }

            if (isset($data['version']) && (int) $data['version'] !== $current->version) {
                $this->assert(false, ResponseCode::CONFLICT, '布局版本冲突，请重新读取后再保存');
            }

            $current->layout = $data['layout'];
            $current->version = $current->version + 1;
            $current->save();

            return ['scope' => $current->scope, 'version' => $current->version];
        });
    }

    /**
     * 按作用域解析所有者（角色键或用户ID）
     */
    private function owner(string $scope): array
    {
        return match ($scope) {
            'default' => ['role_key' => null, 'user_id' => null],
            'role' => ['role_key' => $this->roleKey(auth()->user()), 'user_id' => null],
            default => ['role_key' => null, 'user_id' => auth()->id()],
        };
    }

    /**
     * 定位一条布局记录
     */
    private function find(string $scope, ?string $roleKey, ?int $userId): ?DashboardLayout
    {
        return DashboardLayout::query()
            ->where('scope', $scope)
            ->where('role_key', $roleKey)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * 组装读响应
     */
    private function present(?DashboardLayout $row, string $scope): array
    {
        return [
            'scope' => $scope,
            'layout' => $row?->layout ?? self::DEFAULT_LAYOUT,
            'version' => (int) ($row?->version ?? 1),
        ];
    }

    /**
     * 当前用户角色键（无角色返回 null）
     */
    private function roleKey(mixed $user): ?string
    {
        $role = $user?->role_view;

        return $role === null || $role === '' ? null : (string) $role;
    }
}
