<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClinicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'doctor_user_id' => ['required', 'integer', 'exists:users,id'],
            'org_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'record_type' => ['nullable', 'string', 'in:OUTPATIENT,EMERGENCY,FOLLOW_UP'],
            'chief_complaint' => ['nullable', 'string'],
            'present_history' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string', 'max:500'],
            'treatment' => ['nullable', 'string'],
            'visit_at' => ['required', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'patient_id' => '患者',
            'doctor_user_id' => '接诊医生',
            'org_id' => '接诊机构',
            'record_type' => '记录类型',
            'chief_complaint' => '主诉',
            'diagnosis' => '诊断',
            'visit_at' => '就诊时间',
        ];
    }
}
