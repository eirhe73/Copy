<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patientId' => ['nullable', 'string', 'max:32'],
            'patientName' => ['required_without:patientId', 'nullable', 'string', 'max:64'],
            'gender' => ['required_without:patientId', 'nullable', 'string', 'in:MALE,FEMALE'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'chiefComplaint' => ['required_without:patientId', 'nullable', 'string', 'max:255'],
            'sourceHospital' => ['nullable', 'string', 'max:64'],
            'sourceDepartment' => ['nullable', 'string', 'max:64'],
            'targetHospital' => ['required', 'string', 'max:64'],
            'targetDepartment' => ['required', 'string', 'max:64'],
            'nominatedDoctorId' => ['nullable', 'string', 'max:64'],
            'token' => ['nullable', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'patientId' => '患者编号',
            'patientName' => '患者姓名',
            'gender' => '性别',
            'chiefComplaint' => '主诉',
            'targetHospital' => '接诊医院',
            'targetDepartment' => '接诊科室',
            'nominatedDoctorId' => '意向接诊医生',
            'token' => '会诊室 token',
        ];
    }
}
