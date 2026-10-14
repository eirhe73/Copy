<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:64'],
            'gender' => ['nullable', 'string', 'in:MALE,FEMALE,UNKNOWN'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'phone' => ['nullable', 'string', 'max:20'],
            'idCard' => ['nullable', 'string', 'max:30'],
            'chiefComplaint' => ['nullable', 'string', 'max:255'],
            'symptoms' => ['nullable', 'array'],
            'stage' => ['nullable', 'string', 'in:registered,consulting,accepted,admitted,transfer-requested,in-transit,local-closed'],
            'institutionId' => ['nullable', 'string', 'max:32'],
            'departmentId' => ['nullable', 'string', 'max:32'],
            'notes' => ['nullable', 'string'],
            'isDraft' => ['nullable', 'integer', 'in:0,1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '姓名',
            'gender' => '性别',
            'idCard' => '证件号',
            'phone' => '联系电话',
        ];
    }
}
