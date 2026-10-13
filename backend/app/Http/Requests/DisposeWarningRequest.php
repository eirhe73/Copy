<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 预警处置（闭环上报）入参校验
 */
class DisposeWarningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage' => ['required', 'string', 'in:预警触发,护士确认,医生到床,干预完成'],
            'note' => ['nullable', 'string', 'max:255'],
            'actorId' => ['nullable', 'string', 'max:32'],
            'actorName' => ['nullable', 'string', 'max:64'],
            'nextStatus' => ['nullable', 'string', 'in:new,acknowledged,treating,resolved'],
        ];
    }

    public function attributes(): array
    {
        return [
            'stage' => '处置阶段',
            'note' => '处置意见',
            'actorId' => '操作人ID',
            'actorName' => '操作人姓名',
            'nextStatus' => '预警状态',
        ];
    }
}
