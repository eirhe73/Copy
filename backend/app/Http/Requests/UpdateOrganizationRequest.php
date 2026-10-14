<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200'],
            'shortName' => ['sometimes', 'string', 'max:100'],
            'level' => ['sometimes', 'string', 'in:center,city,county,township,village'],
            'province' => ['sometimes', 'string', 'max:50'],
            'city' => ['sometimes', 'string', 'max:50'],
            'county' => ['sometimes', 'string', 'max:100'],
            'town' => ['sometimes', 'nullable', 'string', 'max:50'],
            'verified' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '机构名称',
            'level' => '机构层级',
        ];
    }
}
