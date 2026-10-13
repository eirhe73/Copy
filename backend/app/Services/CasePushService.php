<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\EmergencyPatient;
use App\Models\Message;
use App\Models\Patient;

/**
 * 院前病例推送：以 patientId（优先）/ task120Id 组装院前病例摘要
 */
class CasePushService extends Service
{
    public function index(array $query): array
    {
        $patientId = $query['patientId'] ?? null;
        $task120Id = $query['task120Id'] ?? null;

        $this->assert($patientId || $task120Id, ResponseCode::BAD_REQUEST, 'task120Id 与 patientId 至少提供一个');

        $patient = null;
        $emergency = null;

        if ($patientId) {
            $patient = Patient::query()->where('patient_code', $patientId)->first();
            if (! $patient) {
                $emergency = EmergencyPatient::query()->where('patient_no', $patientId)->latest('id')->first();
            }
        }

        if (! $patient && ! $emergency && $task120Id) {
            $emergency = EmergencyPatient::query()->where('task120_id', $task120Id)->latest('id')->first();
            if ($emergency && $emergency->patient_no) {
                $patient = Patient::query()->where('patient_code', $emergency->patient_no)->first();
            }
        }

        $this->assert($patient || $emergency, ResponseCode::NOT_FOUND, '未找到对应病例');

        $resolvedId = $patient?->patient_code ?? $emergency?->patient_no;
        $messages = Message::query()->where('patient_id', $resolvedId)->orderBy('at')->get();

        return [
            'patientId' => $resolvedId,
            'patientName' => $patient?->real_name ?? $emergency?->name ?? '',
            'gender' => $this->resolveGender($patient, $emergency),
            'age' => (int) ($patient?->age ?? $emergency?->age ?? 0),
            'entry' => $patient?->entry ?? 'field',
            'step' => $patient?->stage ?? 'registered',
            'sourceInstitutionId' => $patient?->institution_id ?? '',
            'sourceDepartmentId' => $patient?->department_id ?? '',
            'observations' => $this->resolveObservations($patient, $emergency),
            'latestVitals' => $this->latestVitals(),
            'messages' => $messages->map(fn (Message $m) => [
                'id' => $m->message_id,
                'kind' => $m->category !== '' ? $m->category : 'service',
                'title' => $m->title,
                'text' => $m->text,
                'at' => optional($m->at)->toIso8601String(),
                'read' => (bool) $m->is_read,
            ])->all(),
            'pushedAt' => optional($messages->last()?->at ?? $patient?->updated_at ?? $emergency?->updated_at)->toIso8601String(),
        ];
    }

    private function resolveGender(?Patient $patient, ?EmergencyPatient $emergency): string
    {
        if ($patient) {
            return match ($patient->gender) {
                'GENDER_FEMALE' => 'FEMALE',
                default => 'MALE',
            };
        }

        return (int) $emergency?->gender === 1 ? 'FEMALE' : 'MALE';
    }

    private function resolveObservations(?Patient $patient, ?EmergencyPatient $emergency): array
    {
        if ($patient) {
            $prehospital = $patient->prehospital ?? [];
            $list = [];
            if (! empty($prehospital['complaint'])) {
                $list[] = $prehospital['complaint'];
            }
            foreach ($prehospital['symptoms'] ?? [] as $symptom) {
                if ($symptom !== '') {
                    $list[] = $symptom;
                }
            }

            return $list;
        }

        return $emergency?->chief_complaint ? [$emergency->chief_complaint] : [];
    }

    private function latestVitals(): array
    {
        return [
            'heartRate' => 0,
            'spo2' => 0,
            'resp' => 0,
            'temp' => 0,
            'systolic' => 0,
            'diastolic' => 0,
            'news' => 0,
            'at' => now()->toIso8601String(),
        ];
    }
}
