<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreAdmissionRequest extends FormRequest
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
            'institutionId' => ['required', 'string', 'max:32'],
            'departmentId' => ['required', 'string', 'max:32'],
            'prehospital' => ['required', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '姓名',
            'gender' => '性别',
            'institutionId' => '上报机构编号',
            'departmentId' => '上报科室编号',
            'prehospital' => '院前上报明细',
        ];
    }
}
