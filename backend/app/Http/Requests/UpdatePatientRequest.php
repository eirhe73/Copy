<?php

namespace App\Http\Requests;

class UpdatePatientRequest extends StorePatientRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        return collect($rules)
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->all();
    }
}
