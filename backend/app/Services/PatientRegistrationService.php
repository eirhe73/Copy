<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;

/**
 * 院内快速登记 / OCR / 院前上报：写 patients
 */
class PatientRegistrationService extends Service
{
    public function store(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $patient = Patient::create([
                'name' => $data['name'],
                'gender' => $this->toGender($data['gender']),
                'age' => isset($data['age']) ? (int) $data['age'] : null,
                'phone' => $data['phone'] ?? '',
                'chief_complaint' => $data['chiefComplaint'] ?? '',
                'is_draft' => (int) ($data['isDraft'] ?? 0),
            ]);

            return [
                'patientId' => $patient->patient_id,
                'isDraft' => (int) $patient->is_draft,
            ];
        });
    }

    public function ocrId(array $data): array
    {
        $this->assert(! empty($data['imageBase64']), ResponseCode::BAD_REQUEST, '证件照片不能为空');

        return [
            'name' => '李建国',
            'gender' => 'MALE',
            'idCard' => '510***********0012',
            'birthDate' => '1963-04-12',
            'address' => '四川省威远县连界镇',
            'nationality' => '汉',
        ];
    }

    public function preAdmission(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $patient = Patient::create([
                'name' => $data['name'],
                'gender' => $this->toGender($data['gender']),
                'age' => isset($data['age']) ? (int) $data['age'] : null,
                'phone' => $data['phone'] ?? '',
                'prehospital' => $data['prehospital'],
                'stage' => 'transfer-requested',
                'source' => '120',
                'institution_id' => $data['institutionId'],
                'department_id' => $data['departmentId'],
            ]);

            $patient->source_record_id = 'MOBILE-'.$patient->patient_id;
            $patient->save();

            return [
                'patientId' => $patient->patient_id,
                'sourceRecordId' => $patient->source_record_id,
                'stage' => $patient->stage,
            ];
        });
    }

    private function toGender(string $gender): int
    {
        return match (strtoupper($gender)) {
            'MALE' => 0,
            'FEMALE' => 1,
            default => 2,
        };
    }
}
