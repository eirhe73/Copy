<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmergencyEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_source' => ['required', 'string', 'max:50'],
            'occurred_at' => ['required', 'date'],
            'accept_org_id' => ['required', 'integer', 'exists:organizations,id'],
            'accepted_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'eta' => ['nullable', 'date'],
            'scene_address' => ['nullable', 'string', 'max:500'],
            'scene_phone' => ['nullable', 'string', 'max:50'],
            'symptom_duration' => ['nullable', 'string', 'max:100'],
            'consciousness' => ['nullable', 'string', 'max:50'],
            'provisional_dx' => ['nullable', 'string', 'max:200'],
            'triage_level' => ['nullable', 'string', 'in:TRIAGE_I,TRIAGE_II,TRIAGE_III,TRIAGE_IV'],
            'channel_type' => ['nullable', 'string', 'max:50'],
            'target_dept_name' => ['nullable', 'string', 'max:100'],
            'transport_mode' => ['nullable', 'string', 'max:50'],
            'scene_hr' => ['nullable', 'string', 'max:20'],
            'scene_sbp' => ['nullable', 'string', 'max:20'],
            'scene_dbp' => ['nullable', 'string', 'max:20'],
            'scene_spo2' => ['nullable', 'string', 'max:20'],
            'scene_rr' => ['nullable', 'string', 'max:20'],
            'scene_temp' => ['nullable', 'string', 'max:20'],
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'patient_mode' => ['nullable', 'string', 'max:20'],
            'temp_gender' => ['nullable', 'string', 'max:20'],
            'temp_summary' => ['nullable', 'string'],
            'chief' => ['required', 'string'],
            'risk_level' => ['nullable', 'string', 'in:RISK_LOW,RISK_MEDIUM,RISK_HIGH'],
            'event_stage' => ['nullable', 'string', 'max:50'],
            'event_status' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function attributes(): array
    {
        return [
            'event_source' => '事件来源',
            'occurred_at' => '发生时间',
            'accept_org_id' => '受理机构',
            'chief' => '主诉',
            'triage_level' => '分诊级别',
            'risk_level' => '风险等级',
            'patient_id' => '患者',
        ];
    }
}
