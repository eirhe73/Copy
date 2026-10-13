<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQcStandardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'version' => ['required', 'string', 'max:20'],
            'standard_name' => ['required', 'string', 'max:200'],
            'category' => ['nullable', 'string', 'max:100'],
            'target_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'version' => '标准版本',
            'standard_name' => '标准名称',
            'category' => '标准分类',
            'target_rate' => '目标合规率',
        ];
    }
}
