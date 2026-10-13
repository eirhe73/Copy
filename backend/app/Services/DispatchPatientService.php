<?php

namespace App\Services;

use App\Models\EmergencyPatient;
use Illuminate\Support\Facades\DB;

/**
 * 突击队「车上就近登记」：写 emergency_patients，按 120 任务号幂等 upsert
 */
class DispatchPatientService extends Service
{
    public function store(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $payload = [
                'event_id' => $data['eventId'] ?? null,
                'task120_id' => $data['task120Id'] ?? null,
                'vehicle_id' => $data['vehicleId'] ?? null,
                'vehicle_plate' => $data['vehiclePlate'] ?? '',
                'name' => $data['name'],
                'gender' => strtoupper($data['gender']) === 'FEMALE' ? 1 : 0,
                'age' => (int) ($data['age'] ?? 0),
                'phone' => $data['phone'] ?? '',
                'chief_complaint' => $data['chiefComplaint'] ?? '',
                'is_draft' => (int) ($data['isDraft'] ?? 0),
            ];

            $patient = null;
            if (! empty($data['task120Id'])) {
                $patient = EmergencyPatient::query()
                    ->where('task120_id', $data['task120Id'])
                    ->latest('id')
                    ->first();
            }

            if ($patient) {
                $patient->update($payload);
            } else {
                $payload['patient_no'] = $this->generatePatientNo();
                $patient = EmergencyPatient::create($payload);
            }

            return [
                'patientId' => $patient->patient_no,
                'isDraft' => (int) $patient->is_draft,
            ];
        });
    }

    private function generatePatientNo(): string
    {
        $prefix = 'PAT-'.now()->format('Ymd').'-';
        $seq = (int) DB::table('emergency_patients')->where('patient_no', 'like', $prefix.'%')->count();

        do {
            $seq++;
            $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        } while (DB::table('emergency_patients')->where('patient_no', $code)->exists());

        return $code;
    }
}
