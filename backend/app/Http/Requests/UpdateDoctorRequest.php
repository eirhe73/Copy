<?php

namespace App\Http\Requests;

class UpdateDoctorRequest extends StoreDoctorRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // 更新时所有字段均为可选（sometimes）
        $rules = collect($rules)
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->all();

        // 账号唯一性排除自身；密码留空表示不修改
        $doctor = $this->route('doctor');
        $rules['username'] = ['sometimes', 'string', 'max:100', 'unique:users,username,'.$doctor->id];
        $rules['password'] = ['sometimes', 'string', 'min:6', 'max:100'];

        return $rules;
    }
}
