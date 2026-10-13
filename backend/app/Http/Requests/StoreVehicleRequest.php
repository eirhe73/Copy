<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate_number' => ['required', 'string', 'max:20', 'unique:vehicles,plate_number'],
            'vehicle_type' => ['nullable', 'string', 'max:50'],
            'org_id' => ['required', 'integer', 'exists:organizations,id'],
            'vehicle_status' => ['nullable', 'string', 'in:VEHICLE_DISPATCHED,VEHICLE_STANDBY,VEHICLE_MAINTENANCE'],
            'driver_name' => ['nullable', 'string', 'max:100'],
            'driver_phone' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function attributes(): array
    {
        return [
            'plate_number' => '车牌号',
            'org_id' => '所属机构',
            'vehicle_status' => '车辆状态',
        ];
    }
}
