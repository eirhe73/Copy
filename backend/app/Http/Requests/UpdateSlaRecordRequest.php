<?php

namespace App\Http\Requests;

class UpdateSlaRecordRequest extends StoreSlaRecordRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // 更新时所有字段均为可选（sometimes）
        return collect($rules)
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->all();
    }
}
