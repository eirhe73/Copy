<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventTimelineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'node_type' => ['required', 'string', 'max:50'],
            'node_title' => ['required', 'string', 'max:200'],
            'content' => ['nullable', 'string'],
            'occurred_at' => ['required', 'date'],
            'operator_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'node_type' => '节点类型',
            'node_title' => '节点标题',
            'content' => '节点详情',
            'occurred_at' => '发生时间',
            'operator_user_id' => '操作人',
        ];
    }
}
