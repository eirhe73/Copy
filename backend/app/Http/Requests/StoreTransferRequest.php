<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patientId' => ['required', 'string', 'exists:patients,patient_id'],
            'direction' => ['required', 'string', 'in:UP,DOWN'],
            'sourceInstitutionId' => ['required', 'string'],
            'sourceDepartmentId' => ['nullable', 'string'],
            'targetInstitutionId' => ['required', 'string'],
            'targetDepartmentId' => ['nullable', 'string'],
            'greenChannel' => ['nullable', 'boolean'],
            'channelType' => ['nullable', 'string', 'in:chest_pain,stroke,trauma,critical_pregnant,neonatal'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'patientId' => '患者编号',
            'direction' => '转诊方向',
            'sourceInstitutionId' => '来源机构',
            'targetInstitutionId' => '目标机构',
            'greenChannel' => '绿色通道',
            'channelType' => '通道类型',
            'reason' => '转诊原因',
        ];
    }
}
