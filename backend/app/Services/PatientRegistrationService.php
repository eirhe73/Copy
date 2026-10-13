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
            $patient = Patient::create($this->buildPayload($data));

            return [
                'patientId' => $patient->patient_code,
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
            $patientCode = $this->generatePatientCode();

            $patient = Patient::create([
                'patient_code' => $patientCode,
                'real_name' => $data['name'],
                'gender' => $this->toGender($data['gender']),
                'age' => isset($data['age']) ? (int) $data['age'] : null,
                'phone' => $data['phone'] ?? null,
                'prehospital' => $data['prehospital'],
                'entry' => 'field',
                'stage' => 'transfer-requested',
                'source_record_id' => 'MOBILE-'.$patientCode,
                'institution_id' => $data['institutionId'],
                'department_id' => $data['departmentId'],
            ]);

            return [
                'patientId' => $patient->patient_code,
                'sourceRecordId' => $patient->source_record_id,
                'stage' => $patient->stage,
            ];
        });
    }

    private function buildPayload(array $data): array
    {
        $payload = [
            'patient_code' => $this->generatePatientCode(),
            'real_name' => $data['name'],
            'gender' => $this->toGender($data['gender']),
            'age' => isset($data['age']) ? (int) $data['age'] : null,
            'phone' => $data['phone'] ?? null,
            'is_draft' => (int) ($data['isDraft'] ?? 0),
        ];

        if (! empty($data['chiefComplaint'])) {
            $payload['prehospital'] = ['complaint' => $data['chiefComplaint']];
        }

        return $payload;
    }

    private function toGender(string $gender): string
    {
        return strtoupper($gender) === 'FEMALE' ? 'GENDER_FEMALE' : 'GENDER_MALE';
    }

    private function generatePatientCode(): string
    {
        $prefix = 'PAT-'.now()->format('Ymd').'-';
        $seq = (int) DB::table('patients')->where('patient_code', 'like', $prefix.'%')->count();

        do {
            $seq++;
            $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        } while (DB::table('patients')->where('patient_code', $code)->exists());

        return $code;
    }
}
