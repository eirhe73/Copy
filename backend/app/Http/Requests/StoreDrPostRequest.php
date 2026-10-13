<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDrPostRequest extends FormRequest
{
    /** category 字符串码 → 存储整数；§4.1（0基层反馈 1问题上报） */
    private const CATEGORY_CODES = ['FEEDBACK' => 0, 'ISSUE' => 1];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * 落库前把请求体中的字符串码归一化为整数
     */
    protected function prepareForValidation(): void
    {
        $category = $this->input('category');
        if (is_string($category) && isset(self::CATEGORY_CODES[strtoupper($category)])) {
            $this->merge(['category' => self::CATEGORY_CODES[strtoupper($category)]]);
        }
    }

    public function rules(): array
    {
        return [
            'category' => ['required', 'integer', 'in:0,1'],
            'title' => ['required', 'string', 'max:128'],
            'content' => ['required', 'string'],
            'institutionId' => ['required', 'string', 'max:64'],
            'institutionName' => ['nullable', 'string', 'max:64'],
            'department' => ['nullable', 'string', 'max:64'],
            'reporterId' => ['nullable', 'string', 'max:64'],
            'reporterName' => ['nullable', 'string', 'max:64'],
            'contact' => ['nullable', 'string', 'max:64'],
            'priority' => ['nullable', 'integer', 'in:0,1'],
            'attachments' => ['nullable', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'category' => '反馈类型',
            'title' => '标题',
            'content' => '内容',
            'institutionId' => '上报机构',
        ];
    }
}
