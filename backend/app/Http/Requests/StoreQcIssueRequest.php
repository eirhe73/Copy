<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQcIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'issue_title' => ['required', 'string', 'max:200'],
            'severity' => ['nullable', 'string', 'in:SEVERITY_LOW,SEVERITY_MEDIUM,SEVERITY_HIGH'],
            'issue_source' => ['nullable', 'string', 'max:50'],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'current_stage' => ['nullable', 'string', 'max:50'],
            'qc_status' => ['nullable', 'string', 'in:QC_OPEN,QC_RECTIFYING,QC_CLOSED'],
            'due_at' => ['nullable', 'date'],
            'related_type' => ['nullable', 'string', 'max:50'],
            'related_id' => ['nullable', 'integer'],
            'supervise_target' => ['nullable', 'string', 'max:200'],
            'check_method' => ['nullable', 'string', 'max:50'],
            'check_item' => ['nullable', 'string', 'max:200'],
            'check_result' => ['nullable', 'string', 'max:200'],
            'discovered_at' => ['nullable', 'date'],
            'is_on_time_completed' => ['nullable', 'boolean'],
            'event_id' => ['nullable', 'integer', 'exists:emergency_events,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'issue_title' => '问题标题',
            'severity' => '严重程度',
            'owner_user_id' => '责任人',
            'qc_status' => '质控状态',
            'due_at' => '整改期限',
            'event_id' => '关联急救事件',
        ];
    }
}
