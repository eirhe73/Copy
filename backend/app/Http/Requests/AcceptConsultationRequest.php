<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doctorId' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'doctorId' => '接诊医生',
        ];
    }
}
