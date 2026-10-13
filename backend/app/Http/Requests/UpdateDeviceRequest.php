<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 更新设备（§5.2，全部字段可选，只更新传入字段）
 */
class UpdateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:32'],
            'online' => ['nullable', 'boolean'],
            'alarm' => ['nullable', 'boolean'],
            'bedId' => ['nullable', 'string', 'max:64'],
            'bedLabel' => ['nullable', 'string', 'max:64'],
            'patientId' => ['nullable', 'string', 'max:64'],
            'patientName' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '设备名称',
            'online' => '在线状态',
            'alarm' => '告警状态',
            'bedId' => '床位编号',
            'bedLabel' => '床位标签',
            'patientId' => '患者编号',
            'patientName' => '患者姓名',
        ];
    }
}
