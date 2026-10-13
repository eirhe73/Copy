<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'real_name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'org_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'home_route' => ['nullable', 'string', 'max:200'],
            'user_status' => ['nullable', 'string', 'in:USER_ACTIVE,USER_DISABLED'],
        ];
    }

    public function attributes(): array
    {
        return [
            'real_name' => '医生姓名',
            'username' => '登录账号',
            'password' => '登录密码',
            'org_id' => '所属机构',
            'phone' => '联系电话',
        ];
    }
}
