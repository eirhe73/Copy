<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orgId' => ['required', 'string', 'max:50', 'unique:organizations,org_code'],
            'name' => ['required', 'string', 'max:200'],
            'shortName' => ['nullable', 'string', 'max:100'],
            'level' => ['required', 'string', 'in:center,city,county,township,village'],
            'province' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:50'],
            'county' => ['nullable', 'string', 'max:100'],
            'town' => ['nullable', 'string', 'max:50'],
            'verified' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'orgId' => '机构编码',
            'name' => '机构名称',
            'level' => '机构层级',
        ];
    }
}
