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
            // UNKNOWN 必须放行：患者列表接口对"性别未知"的患者返回 UNKNOWN，
            // 会诊工作台原样回传该字段，原先只允许 MALE/FEMALE 会让这类患者发不起会诊。
            'gender' => ['required_without:patientId', 'nullable', 'string', 'in:MALE,FEMALE,UNKNOWN'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'chiefComplaint' => ['required_without:patientId', 'nullable', 'string', 'max:255'],
            'sourceHospital' => ['nullable', 'string', 'max:64'],
            'sourceDepartment' => ['nullable', 'string', 'max:64'],
            'targetHospital' => ['required', 'string', 'max:64'],
            'targetDepartment' => ['required', 'string', 'max:64'],
            'nominatedDoctorId' => ['nullable', 'string', 'max:64'],
            'token' => ['nullable', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:255'],
            // 定时会诊：应传带时区的 ISO8601（如 2026-10-14T09:30:00.000Z），
            // 应用时区为 UTC，无时区的裸时间会按 UTC 解释导致偏差 8 小时
            'scheduledAt' => ['nullable', 'date', 'after:now'],
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
            'scheduledAt' => '定时开始时间',
        ];
    }
}
