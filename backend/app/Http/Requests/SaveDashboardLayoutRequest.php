<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveDashboardLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope' => ['nullable', 'string', 'in:default,role,user'],
            'layout' => ['required', 'array'],
            'layout.panels' => ['required', 'array', 'min:1'],
            'layout.panels.*' => ['array'],
            'layout.panels.*.key' => ['required', 'string', 'max:32'],
            'layout.fullscreen' => ['nullable', 'boolean'],
            'layout.theme' => ['nullable', 'string', 'max:16'],
            'version' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'layout.required' => '布局配置不能为空',
            'layout.array' => '布局配置格式不正确',
            'layout.panels.required' => '布局必须包含 panels',
            'layout.panels.array' => 'panels 格式不正确',
            'layout.panels.min' => '布局至少包含一个面板',
            'layout.panels.*.key.required' => '面板 key 不能为空',
            'scope.in' => '作用域不合法（可选 default / role / user）',
        ];
    }
}
