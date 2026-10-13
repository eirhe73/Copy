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
            'real_name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'in:GENDER_MALE,GENDER_FEMALE,GENDER_UNKNOWN'],
            'birth_date' => ['nullable', 'date'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'id_card' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'medical_history' => ['nullable', 'string'],
            'allergy_history' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'real_name' => '姓名',
            'gender' => '性别',
            'id_card' => '身份证号',
            'phone' => '联系电话',
        ];
    }
}
