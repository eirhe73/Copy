<?php

namespace App\Http\Requests;

class UpdateTransferRequest extends StoreTransferRequest
{
    public function rules(): array
    {
        $rules = collect(parent::rules())
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->all();

        $rules['status'] = ['sometimes', 'string', 'in:REQUESTED,ACCEPTED,IN_TRANSIT,ARRIVED,COMPLETED,REJECTED'];
        $rules['transportVehicleId'] = ['sometimes', 'nullable', 'string'];

        return $rules;
    }

    public function attributes(): array
    {
        return parent::attributes() + [
            'status' => '转诊状态',
            'transportVehicleId' => '转运车辆',
        ];
    }
}
