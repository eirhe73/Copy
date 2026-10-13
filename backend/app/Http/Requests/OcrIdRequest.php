<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OcrIdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'imageBase64' => ['required', 'string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'imageBase64' => '证件照片',
        ];
    }
}
