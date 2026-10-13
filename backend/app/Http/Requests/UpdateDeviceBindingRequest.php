<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 设备改绑/解绑床位（§3.2）
 */
class UpdateDeviceBindingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bedId' => ['nullable', 'string', 'max:64'],
            'bedLabel' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'bedId' => '目标床位编号',
            'bedLabel' => '床位标签',
        ];
    }
}
