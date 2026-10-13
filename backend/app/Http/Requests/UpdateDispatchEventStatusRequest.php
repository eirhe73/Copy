<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDispatchEventStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:DISPATCHING,ON_SCENE,RETURNING'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => '目标状态不能为空',
            'status.in' => '目标状态不合法（可选 DISPATCHING / ON_SCENE / RETURNING）',
        ];
    }
}
