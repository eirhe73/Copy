<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Department;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\JWTGuard;

/**
 * 认证服务：登录、登出、当前用户、令牌续期（JWT）
 *
 * 对应 08-系统/01-认证接口.md §3.2~3.5；
 * 令牌由 tymon/jwt-auth 无状态签发，登出通过黑名单使当前令牌立即失效。
 */
class AuthService extends Service
{
    /** 用户状态：停用 */
    private const STATUS_DISABLED = 'USER_DISABLED';

    /** 数据权限角色默认值 */
    private const DEFAULT_ROLE_VIEW = 'doctor';

    /** 按数据权限角色汇总的权限键（项目无权限表，取文档示例集合） */
    private const PERMISSIONS = [
        'doctor' => ['patient.view', 'consult.join', 'transfer.accept'],
        'director' => ['patient.view', 'consult.join', 'transfer.accept', 'qc.view', 'center.manage'],
    ];

    /**
     * 登录：校验账号密码并签发 JWT
     */
    public function login(array $data): array
    {
        $user = User::query()->where('username', $data['username'])->first();

        $this->assert($user !== null, ResponseCode::UNAUTHORIZED, '账号或密码错误');
        $this->assert(
            Hash::check((string) $data['password'], (string) $user->password_hash),
            ResponseCode::UNAUTHORIZED,
            '账号或密码错误'
        );
        $this->assert($user->user_status !== self::STATUS_DISABLED, ResponseCode::FORBIDDEN, '账号已停用，请联系管理员');

        $token = $this->guard()->login($user);

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ])->save();

        return [
            'token' => $token,
            'tokenType' => 'Bearer',
            'expiresAt' => $this->expiresAt(),
            'user' => $this->brief($user),
        ];
    }

    /**
     * 登出：将当前令牌加入黑名单
     */
    public function logout(): void
    {
        $this->assert($this->guard()->check(), ResponseCode::UNAUTHORIZED);

        $this->guard()->logout();
    }

    /**
     * 当前用户：用户概要 + 角色 + 权限
     */
    public function me(): array
    {
        $user = $this->guard()->user();
        $this->assert($user instanceof User, ResponseCode::UNAUTHORIZED);

        $org = $this->organization($user);
        $roleView = $user->role_view ?: self::DEFAULT_ROLE_VIEW;

        return [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->real_name,
                'phone' => $user->phone,
                'profession' => $user->profession ?: '',
                'institutionId' => $org?->org_code,
                'institutionName' => $org?->org_name,
                'departmentId' => $user->department_id ?: '',
                'departmentName' => $this->departmentName($user),
                'workAreas' => $this->workAreas($user),
            ],
            'roleView' => $roleView,
            'permissions' => self::PERMISSIONS[$roleView] ?? self::PERMISSIONS[self::DEFAULT_ROLE_VIEW],
        ];
    }

    /**
     * 刷新令牌：注销旧令牌并签发新令牌
     */
    public function refresh(): array
    {
        $this->assert($this->guard()->check(), ResponseCode::UNAUTHORIZED);

        return [
            'token' => $this->guard()->refresh(),
            'tokenType' => 'Bearer',
            'expiresAt' => $this->expiresAt(),
        ];
    }

    /**
     * JWT 认证守卫：api guard 驱动为 jwt，运行时即 Tymon\JWTAuth\JWTGuard
     */
    private function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return $guard;
    }

    /**
     * 令牌过期时间（依据 jwt guard 的 TTL）
     */
    private function expiresAt(): string
    {
        return Carbon::now()->addMinutes((int) $this->guard()->factory()->getTTL())->toIso8601String();
    }

    /**
     * 登录返回的用户概要
     */
    private function brief(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->real_name,
            'roleView' => $user->role_view ?: self::DEFAULT_ROLE_VIEW,
            'profession' => $user->profession ?: '',
            'institutionId' => $this->organization($user)?->org_code,
            'departmentId' => $user->department_id ?: '',
        ];
    }

    private function organization(User $user): ?Organization
    {
        return $user->org_id ? Organization::query()->find($user->org_id) : null;
    }

    private function departmentName(User $user): string
    {
        if (! $user->org_id || ! $user->department_id) {
            return '';
        }

        return (string) Department::query()
            ->where('org_id', $user->org_id)
            ->where('dept_code', $user->department_id)
            ->value('dept_name');
    }

    /**
     * 工作区：项目无 organization_members 表，按身份类型推导
     */
    private function workAreas(User $user): array
    {
        $identity = (string) $user->identity_type;

        if (str_contains($identity, '急救') || str_contains($identity, 'AMBULANCE')) {
            return ['field', 'ambulance'];
        }

        return ['reception', 'ward'];
    }
}
