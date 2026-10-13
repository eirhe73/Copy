<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 更新中心能力画像（§3.3）
 */
class UpdateCenterProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orgId' => ['required', 'string', 'max:32'],
            'teamSize' => ['nullable', 'integer', 'min:0'],
            'equipment' => ['nullable', 'array'],
            'equipment.*' => ['string', 'max:64'],
            'annualVolume' => ['nullable', 'integer', 'min:0'],
            'pathwayRate' => ['nullable', 'numeric', 'between:0,1'],
            'assessmentNote' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'orgId' => '承载机构编码',
            'teamSize' => '救治团队人数',
            'equipment' => '关键设备清单',
            'annualVolume' => '年救治病例数',
            'pathwayRate' => '路径达标率',
            'assessmentNote' => '时限考核配置说明',
        ];
    }

    public function messages(): array
    {
        return [
            'orgId.required' => '承载机构编码不能为空',
            'pathwayRate.between' => '路径达标率需在 0~1 之间',
        ];
    }
}
