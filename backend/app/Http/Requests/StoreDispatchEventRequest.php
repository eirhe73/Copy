<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDispatchEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task120Id' => ['required', 'string', 'max:32', 'unique:emergency_events,task120_id'],
            'level' => ['nullable', 'string', 'in:CRITICAL,ACUTE,GENERAL'],
            'chiefComplaint' => ['required', 'string', 'max:255'],
            'pickupAddress' => ['required', 'string', 'max:500'],
            'destination' => ['nullable', 'string', 'max:64'],
            'startedAt' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'task120Id.required' => '120 任务号不能为空',
            'task120Id.unique' => '该 120 任务号已存在',
            'level.in' => '事件等级不合法（可选 CRITICAL / ACUTE / GENERAL）',
            'chiefComplaint.required' => '主诉不能为空',
            'pickupAddress.required' => '接车地址不能为空',
            'destination.max' => '目标医院名称过长',
            'startedAt.date' => '出警时间格式不正确（需为 ISO 8601 时间）',
        ];
    }
}
