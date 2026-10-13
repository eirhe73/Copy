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
            'event_id' => ['nullable', 'integer', 'exists:emergency_events,id'],
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'from_org_id' => ['required', 'integer', 'exists:organizations,id'],
            'to_org_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'urgency_level' => ['nullable', 'string', 'in:URGENCY_LOW,URGENCY_MEDIUM,URGENCY_HIGH'],
            'transfer_reason' => ['required', 'string'],
            'diagnosis' => ['nullable', 'string', 'max:200'],
            'trigger_source' => ['nullable', 'string', 'max:50'],
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'driver_name' => ['nullable', 'string', 'max:100'],
            'eta' => ['nullable', 'date'],
            'latest_vitals' => ['nullable', 'array'],
            'resource_prep' => ['nullable', 'array'],
            'initiator_user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'from_org_id' => '转出机构',
            'to_org_id' => '转入机构',
            'transfer_reason' => '转诊原因',
            'urgency_level' => '紧急程度',
            'initiator_user_id' => '发起人',
        ];
    }
}
