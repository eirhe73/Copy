<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CasePushRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task120Id' => ['nullable', 'string', 'max:32'],
            'patientId' => ['nullable', 'string', 'max:64'],
        ];
    }
}
