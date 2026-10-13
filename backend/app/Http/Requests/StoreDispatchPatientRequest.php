<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDispatchPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eventId' => ['nullable', 'string', 'max:32'],
            'task120Id' => ['nullable', 'string', 'max:32'],
            'vehicleId' => ['nullable', 'string', 'max:32'],
            'vehiclePlate' => ['nullable', 'string', 'max:16'],
            'name' => ['required', 'string', 'max:64'],
            'gender' => ['required', 'string', 'in:MALE,FEMALE'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'phone' => ['nullable', 'string', 'max:20'],
            'chiefComplaint' => ['nullable', 'string', 'max:255'],
            'isDraft' => ['nullable', 'integer', 'in:0,1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '患者姓名',
            'gender' => '性别',
        ];
    }
}
