<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignDispatchTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eventId' => ['required', 'string', 'max:50'],
            'vehicleId' => ['required', 'string', 'max:32'],
            'vehiclePlate' => ['nullable', 'string', 'max:16'],
            'crew' => ['nullable', 'string', 'max:64'],
            'doctorId' => ['nullable', 'string', 'max:64'],
            'nurseId' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'eventId.required' => '事件编号不能为空',
            'vehicleId.required' => '车辆编号不能为空',
        ];
    }
}
