<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RectifyTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:start,submit,approve,reject'],
            'remark' => ['nullable', 'string'],
            'operator' => ['required', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'action' => '流转动作',
            'operator' => '操作人',
        ];
    }
}
