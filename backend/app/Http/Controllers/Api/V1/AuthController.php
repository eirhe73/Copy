<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Support\Result;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $service)
    {
    }

    /**
     * 登录（§3.2）
     */
    public function login(LoginRequest $request): array
    {
        return Result::success('登录成功', $this->service->login($request->validated()));
    }

    /**
     * 登出（§3.3）
     */
    public function logout(): array
    {
        $this->service->logout();

        return Result::success('退出成功');
    }

    /**
     * 当前用户（§3.4）
     */
    public function me(): array
    {
        return Result::success('获取成功', $this->service->me());
    }

    /**
     * 刷新令牌（§3.5）
     */
    public function refreshToken(): array
    {
        return Result::success('获取成功', $this->service->refresh());
    }
}
