<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Bed;
use App\Models\Department;
use App\Models\Organization;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Builder;

/**
 * 患者列表 / 详情 / 更新（03-患者与床位/02-患者管理接口 §3.2/§3.3/§3.7）
 */
class PatientService extends Service
{
    /** 性别：MALE/FEMALE/UNKNOWN ↔ 0/1/2 */
    private const GENDER_CODES = [
        0 => 'MALE',
        1 => 'FEMALE',
        2 => 'UNKNOWN',
    ];

    private const GENDER_LABELS = [
        0 => '男',
        1 => '女',
        2 => '未知',
    ];

    /** 患者阶段字典（§4.1） */
    private const STAGE_LABELS = [
        'registered' => '待诊',
        'consulting' => '会诊中',
        'accepted' => '已接收',
        'admitted' => '在治',
        'transfer-requested' => '转诊中',
        'in-transit' => '转运中',
        'local-closed' => '出院',
    ];

    /** 患者来源字典（§4.2） */
    private const SOURCE_LABELS = [
        'manual' => '手动登记',
        '120' => '120院前急救',
    ];

    /** 列表入参 → 数据库列映射（camelCase → snake_case） */
    private const COLUMN_MAP = [
        'name' => 'name',
        'gender' => 'gender',
        'age' => 'age',
        'phone' => 'phone',
        'idCard' => 'id_card',
        'chiefComplaint' => 'chief_complaint',
        'symptoms' => 'symptoms',
        'stage' => 'stage',
        'institutionId' => 'institution_id',
        'departmentId' => 'department_id',
        'notes' => 'notes',
        'isDraft' => 'is_draft',
    ];

    /**
     * 患者列表（§3.2）：{total, list}
     */
    public function index(array $filters): array
    {
        $paginator = $this->filteredQuery($filters)
            ->orderByDesc('created_at')
            ->paginate($this->pageSize($filters), ['*'], 'pageNum', $this->pageNum($filters));

        $items = $paginator->items();
        $orgNames = $this->orgNames(collect($items)->pluck('institution_id')->all());
        $deptNames = $this->deptNames(collect($items)->pluck('department_id')->all());
        $beds = $this->bedsByPatient(collect($items)->pluck('patient_id')->all());

        $list = collect($items)
            ->map(fn (Patient $patient) => $this->listItem($patient, $orgNames, $deptNames, $beds))
            ->all();

        return [
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * 患者详情（§3.3）
     */
    public function show(string $patientId): array
    {
        $patient = $this->findPatient($patientId);
        $orgNames = $this->orgNames([$patient->institution_id]);
        $deptNames = $this->deptNames([$patient->department_id]);

        return [
            'patientId' => $patient->patient_id,
            'name' => $patient->name,
            'gender' => $this->genderCode($patient->gender),
            'genderLabel' => $this->genderLabel($patient->gender),
            'age' => $patient->age === null ? null : (int) $patient->age,
            'idCard' => $patient->id_card,
            'phone' => $patient->phone,
            'institutionId' => $patient->institution_id,
            'institutionName' => $orgNames[$patient->institution_id] ?? '',
            'departmentId' => $patient->department_id,
            'departmentName' => $deptNames[$patient->department_id] ?? '',
            'assignedTo' => $patient->assigned_to ?? [],
            'stage' => $patient->stage,
            'stageLabel' => self::STAGE_LABELS[$patient->stage] ?? $patient->stage,
            'chiefComplaint' => $patient->chief_complaint,
            'symptoms' => $patient->symptoms ?? [],
            'notes' => $patient->notes,
            'source' => $patient->source,
            'sourceLabel' => self::SOURCE_LABELS[$patient->source] ?? $patient->source,
            'admittedAt' => optional($patient->admitted_at)->toIso8601String(),
            'bed' => $this->bed($patient->patient_id),
            'prehospital' => $patient->prehospital ?? [],
            'consultation' => [
                'token' => $patient->consultation_token,
                'doctorId' => $patient->consultation_doctor_id,
                'doctorName' => null,
                'requestId' => $patient->consultation_request_id,
            ],
            'createdAt' => optional($patient->created_at)->toIso8601String(),
            'updatedAt' => optional($patient->updated_at)->toIso8601String(),
        ];
    }

    /**
     * 更新患者信息（§3.7）：返回更新后的详情对象
     */
    public function update(string $patientId, array $data): array
    {
        $patient = $this->findPatient($patientId);
        $patient->update($this->columnPayload($data));

        return $this->show($patient->patient_id);
    }

    /**
     * 删除患者（软删除）
     */
    public function delete(string $patientId): void
    {
        $this->findPatient($patientId)->delete();
    }

    /**
     * 列表项（§3.2 字段）
     */
    private function listItem(Patient $patient, array $orgNames, array $deptNames, $beds): array
    {
        $bed = $beds[$patient->patient_id] ?? null;

        return [
            'patientId' => $patient->patient_id,
            'name' => $patient->name,
            'gender' => $this->genderCode($patient->gender),
            'genderLabel' => $this->genderLabel($patient->gender),
            'age' => $patient->age === null ? null : (int) $patient->age,
            'phone' => $patient->phone,
            'stage' => $patient->stage,
            'stageLabel' => self::STAGE_LABELS[$patient->stage] ?? $patient->stage,
            'institutionId' => $patient->institution_id,
            'institutionName' => $orgNames[$patient->institution_id] ?? '',
            'departmentId' => $patient->department_id,
            'departmentName' => $deptNames[$patient->department_id] ?? '',
            'bedId' => $bed?->bed_id,
            'bedLabel' => $bed?->label,
            'chiefComplaint' => $patient->chief_complaint,
            'admittedAt' => optional($patient->admitted_at)->toIso8601String(),
            'source' => $patient->source,
            'sourceLabel' => self::SOURCE_LABELS[$patient->source] ?? $patient->source,
        ];
    }

    /**
     * 机构 org_code => org_name
     */
    private function orgNames(iterable $codes): array
    {
        $codes = collect($codes)->filter(fn ($c) => $c !== null && $c !== '')->unique()->all();

        return $codes === [] ? [] : Organization::query()->whereIn('org_code', $codes)->pluck('org_name', 'org_code')->all();
    }

    /**
     * 科室 dept_code => dept_name
     */
    private function deptNames(iterable $codes): array
    {
        $codes = collect($codes)->filter(fn ($c) => $c !== null && $c !== '')->unique()->all();

        return $codes === [] ? [] : Department::query()->whereIn('dept_code', $codes)->pluck('dept_name', 'dept_code')->all();
    }

    /**
     * 患者编号 => 床位（批量反查，避免逐行查询）
     */
    private function bedsByPatient(iterable $patientIds): array
    {
        $ids = collect($patientIds)->filter(fn ($c) => $c !== null && $c !== '')->unique()->all();

        return $ids === [] ? [] : Bed::query()->whereIn('patient_id', $ids)->get()->keyBy('patient_id')->all();
    }

    /**
     * 列表筛选（§3.2）：stage / keyword / institutionId / departmentId
     */
    private function filteredQuery(array $filters): Builder
    {
        $query = Patient::query();

        if (! empty($filters['stage'])) {
            $stages = array_values(array_filter(array_map('trim', explode(',', (string) $filters['stage']))));
            $query->whereIn('stage', $stages);
        }

        if (! empty($filters['keyword'])) {
            $kw = (string) $filters['keyword'];
            $query->where(function (Builder $q) use ($kw) {
                $q->where('name', 'like', "%{$kw}%")
                    ->orWhere('patient_id', 'like', "%{$kw}%")
                    ->orWhere('id_card', 'like', "%{$kw}%")
                    ->orWhere('phone', 'like', "%{$kw}%");
            });
        }

        if (! empty($filters['institutionId'])) {
            $query->where('institution_id', $filters['institutionId']);
        }

        if (! empty($filters['departmentId'])) {
            $query->where('department_id', $filters['departmentId']);
        }

        return $query;
    }

    /**
     * 床号反查（可为 null）：beds.patient_id = patients.patient_id
     */
    private function bed(?string $patientId): ?array
    {
        if ($patientId === null || $patientId === '') {
            return null;
        }

        $bed = Bed::query()->where('patient_id', $patientId)->first();

        return $bed === null ? null : [
            'bedId' => $bed->bed_id,
            'label' => $bed->label,
        ];
    }

    /**
     * 入参 → 数据库列载荷（仅取校验通过的字段，gender 转 int）
     */
    private function columnPayload(array $data): array
    {
        $payload = [];

        foreach (self::COLUMN_MAP as $input => $column) {
            if (! array_key_exists($input, $data)) {
                continue;
            }

            $value = $data[$input];
            if ($input === 'gender') {
                $value = $this->genderToInt($value);
            }

            $payload[$column] = $value;
        }

        return $payload;
    }

    /**
     * 按患者编号取患者，不存在则 404
     */
    private function findPatient(string $patientId): Patient
    {
        $patient = Patient::query()->where('patient_id', $patientId)->first();
        $this->assert($patient !== null, ResponseCode::NOT_FOUND, '患者不存在');

        return $patient;
    }

    private function genderCode(?int $gender): string
    {
        return self::GENDER_CODES[$gender] ?? 'UNKNOWN';
    }

    private function genderLabel(?int $gender): string
    {
        return self::GENDER_LABELS[$gender] ?? '未知';
    }

    private function genderToInt(?string $gender): int
    {
        return match (strtoupper((string) $gender)) {
            'MALE' => 0,
            'FEMALE' => 1,
            default => 2,
        };
    }

    private function pageSize(array $filters): int
    {
        return max(1, (int) ($filters['pageSize'] ?? 20));
    }

    private function pageNum(array $filters): int
    {
        return max(1, (int) ($filters['pageNum'] ?? 1));
    }
}
