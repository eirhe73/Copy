<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends StoreVehicleRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // 车牌唯一校验排除自身，其余字段改为可选
        $rules['plate_number'] = [
            'sometimes', 'string', 'max:20',
            Rule::unique('vehicles', 'plate_number')->ignore($this->route('vehicle')),
        ];

        return collect($rules)
            ->except('plate_number')
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->merge(['plate_number' => $rules['plate_number']])
            ->all();
    }
}
