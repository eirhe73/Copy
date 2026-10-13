<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PtzControlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'streamId' => ['required', 'string', 'max:64'],
            'action' => ['required', 'string', 'in:pan,tilt,zoom,preset,stop'],
            'direction' => ['nullable', 'string', 'in:left,right,up,down'],
            'step' => ['nullable', 'integer', 'between:1,10'],
            'zoom' => ['nullable', 'string', 'in:in,out'],
            'presetId' => ['nullable', 'integer'],
        ];
    }

    public function attributes(): array
    {
        return [
            'streamId' => '监控点编号',
            'action' => '控制动作',
            'direction' => '方向',
            'step' => '步长',
            'zoom' => '变焦方向',
            'presetId' => '预置位编号',
        ];
    }
}
