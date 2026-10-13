<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptMobileReceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'institutionId' => ['required', 'string', 'max:32'],
            'departmentId' => ['required', 'string', 'max:32'],
            'assigneeId' => ['nullable', 'string', 'max:64'],
            'prepChecklist' => ['nullable', 'array'],
            'remark' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'institutionId' => '接收机构',
            'departmentId' => '接收科室',
        ];
    }
}
