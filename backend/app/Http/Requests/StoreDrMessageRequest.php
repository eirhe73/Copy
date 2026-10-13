<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDrMessageRequest extends FormRequest
{
    /** kind 字符串码 → 存储整数；§4.4（0文字 1语音 2图片 3文件） */
    private const KIND_CODES = ['TEXT' => 0, 'VOICE' => 1, 'IMAGE' => 2, 'FILE' => 3];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * 落库前把请求体中的字符串码归一化为整数
     */
    protected function prepareForValidation(): void
    {
        $kind = $this->input('kind');
        if (is_string($kind) && isset(self::KIND_CODES[strtoupper($kind)])) {
            $this->merge(['kind' => self::KIND_CODES[strtoupper($kind)]]);
        }
    }

    public function rules(): array
    {
        return [
            'threadId' => ['nullable', 'string', 'max:64'],
            'institutionId' => ['nullable', 'string', 'max:64'],
            'institutionName' => ['nullable', 'string', 'max:64'],
            'senderId' => ['nullable', 'string', 'max:64'],
            'senderName' => ['nullable', 'string', 'max:64'],
            'kind' => ['required', 'integer', 'in:0,1,2,3'],
            'content' => ['required_if:kind,0', 'string'],
            'mediaUrl' => ['required_if:kind,1,2,3', 'string', 'max:255'],
            'durationSec' => ['nullable', 'integer', 'min:0'],
            'receiverInstitutionId' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'kind' => '消息类型',
            'content' => '文字内容',
            'mediaUrl' => '媒体地址',
        ];
    }
}
