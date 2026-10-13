<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDrMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'threadId' => ['nullable', 'string', 'max:64'],
            'institutionId' => ['nullable', 'string', 'max:64'],
            'institutionName' => ['nullable', 'string', 'max:64'],
            'senderId' => ['nullable', 'string', 'max:64'],
            'senderName' => ['nullable', 'string', 'max:64'],
            'kind' => ['required', 'string', 'in:TEXT,VOICE,IMAGE,FILE'],
            'content' => ['nullable', 'string'],
            'mediaUrl' => ['nullable', 'string', 'max:255'],
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
