<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSlaRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', 'string', 'max:50'],
            'rule_id' => ['required', 'string', 'max:50'],
            'subject' => ['required', 'string', 'max:200'],
            'owner' => ['nullable', 'string', 'max:100'],
            'role_view' => ['nullable', 'string', 'in:doctor,director'],
            'started_at' => ['required', 'date'],
            'arrived_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'limit_minutes' => ['required', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'kind' => '时限类型',
            'rule_id' => '规则标识',
            'subject' => '对象',
            'owner' => '责任人',
            'started_at' => '计时开始',
            'arrived_at' => '到达时间',
            'limit_minutes' => '时限分钟数',
        ];
    }
}
