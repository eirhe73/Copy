<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDrPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['required', 'string', 'in:FEEDBACK,ISSUE'],
            'title' => ['required', 'string', 'max:128'],
            'content' => ['required', 'string'],
            'institutionId' => ['required', 'string', 'max:64'],
            'institutionName' => ['nullable', 'string', 'max:64'],
            'department' => ['nullable', 'string', 'max:64'],
            'reporterId' => ['nullable', 'string', 'max:64'],
            'reporterName' => ['nullable', 'string', 'max:64'],
            'contact' => ['nullable', 'string', 'max:64'],
            'priority' => ['nullable', 'integer', 'in:0,1'],
            'attachments' => ['nullable', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'category' => '反馈类型',
            'title' => '标题',
            'content' => '内容',
            'institutionId' => '上报机构',
        ];
    }
}
