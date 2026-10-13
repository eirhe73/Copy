<?php

namespace App\Http\Requests;

class UpdateQcIssueRequest extends StoreQcIssueRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // 更新时其余字段均为可选（sometimes）
        $rules = collect($rules)
            ->map(fn (array $rule) => array_merge(['sometimes'], $rule))
            ->all();

        // 乐观锁：更新时须携带当前状态版本
        $rules['state_version'] = ['required', 'integer', 'min:1'];

        return $rules;
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), [
            'state_version' => '状态版本',
        ]);
    }
}
