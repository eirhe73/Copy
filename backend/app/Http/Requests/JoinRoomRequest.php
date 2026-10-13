<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JoinRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:64'],
            'role' => ['required', 'string', 'max:32'],
            'deviceType' => ['nullable', 'string', 'max:16'],
            'joinMode' => ['nullable', 'string', 'max:16'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => '入会人姓名',
            'role' => '角色',
            'deviceType' => '终端类型',
            'joinMode' => '入会方式',
        ];
    }
}
