<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHandoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transferNo' => ['nullable', 'string', 'max:64'],
            'eventId' => ['nullable', 'string', 'max:64'],
            'task120Id' => ['nullable', 'string', 'max:32'],
            'patientId' => ['required', 'string', 'max:64'],
            'patientName' => ['required', 'string', 'max:64'],
            'fromStaffId' => ['required', 'string', 'max:64'],
            'fromStaffName' => ['required', 'string', 'max:64'],
            'toStaffId' => ['nullable', 'string', 'max:64'],
            'toStaffName' => ['nullable', 'string', 'max:64'],
            'toDept' => ['nullable', 'string', 'max:64'],
            'items' => ['required', 'array'],
            'items.*.key' => ['nullable', 'string', 'max:32'],
            'items.*.title' => ['nullable', 'string', 'max:128'],
            'items.*.done' => ['nullable', 'boolean'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
            'signature' => ['nullable', 'string', 'max:32'],
            'handoverAt' => ['nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'patientId' => '患者编号',
            'patientName' => '患者姓名',
            'fromStaffId' => '交接方账号',
            'fromStaffName' => '交接方姓名',
            'items' => '交接明细',
        ];
    }
}
