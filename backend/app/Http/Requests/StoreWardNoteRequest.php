<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 写查房记录（§3.6）
 */
class StoreWardNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', 'string', 'in:查房意见,护理建议,医嘱建议'],
            'content' => ['required', 'string', 'max:2000'],
            'actorId' => ['required', 'string', 'max:32'],
            'actorName' => ['required', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'kind' => '记录类型',
            'content' => '记录正文',
            'actorId' => '记录人ID',
            'actorName' => '记录人姓名',
        ];
    }

    public function messages(): array
    {
        return [
            'kind.required' => '记录类型不能为空',
            'kind.in' => '记录类型不合法（可选 查房意见 / 护理建议 / 医嘱建议）',
            'content.required' => '记录正文不能为空',
            'actorId.required' => '记录人ID不能为空',
            'actorName.required' => '记录人姓名不能为空',
        ];
    }
}
