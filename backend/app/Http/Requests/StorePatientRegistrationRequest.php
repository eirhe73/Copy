<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 急救医生快速登记（POST /v1/patients）入参校验，camelCase
 */
class StorePatientRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'gender' => ['required', 'string', 'in:MALE,FEMALE'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'chiefComplaint' => ['nullable', 'string', 'max:255'],
            'isDraft' => ['nullable', 'integer', 'in:0,1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '姓名',
            'gender' => '性别',
        ];
    }
}
