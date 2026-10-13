<?php

namespace App\Services;

use App\Enums\ResponseCode;
use App\Models\Department;
use App\Models\IcuBed;
use App\Models\Patient;
use App\Models\PatientVital;
use App\Models\WardRound;
use App\Models\WardRoundNote;
use App\Models\Warning;
use Illuminate\Support\Carbon;

/**
 * 急救监控 · 2.7 基层重症监护业务服务
 */
class CriticalCareService extends Service
{
    /** 床位占用状态字典 */
    private const BED_STATUS_LABELS = [
        'available' => '空闲',
        'occupied' => '占用',
    ];

    /** 危重程度字典 */
    private const SEVERITY_LABELS = [
        'critical' => '危重',
        'acute' => '急症',
        'general' => '一般',
    ];

    /** 查房状态字典 */
    private const ROUND_STATUS_LABELS = [
        'scheduled' => '待查房',
        'in_progress' => '进行中',
        'finished' => '已完成',
    ];

    /** 预警等级字典 */
    private const LEVEL_LABELS = [
        'urgent' => '紧急',
        'warning' => '关注',
    ];

    /** 预警状态字典 */
    private const STATUS_LABELS = [
        'new' => '待确认',
        'acknowledged' => '已确认',
        'treating' => '处置中',
        'resolved' => '已闭环',
    ];

    /**
     * §3.1 获取 ICU 床位态势
     */
    public function beds(array $filters): array
    {
        $departmentId = $filters['departmentId'] ?? null;
        $status = $filters['status'] ?? null;

        $base = IcuBed::query()
            ->when($departmentId, fn ($q, $v) => $q->where('department_id', $v));

        $total = (clone $base)->count();
        $occupied = (clone $base)->where('status', 'occupied')->count();

        $summary = [
            'total' => $total,
            'occupied' => $occupied,
            'available' => max($total - $occupied, 0),
            'occupancyRate' => $total > 0 ? (int) round($occupied / $total * 100) : 0,
        ];

        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 50), 1), 100);

        $paginator = (clone $base)
            ->when($status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy('department_id')
            ->orderBy('bed_id')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $deptNames = $this->departmentNames(collect($paginator->items())->pluck('department_id')->all());

        $list = collect($paginator->items())
            ->map(fn (IcuBed $b) => [
                'bedId' => $b->bed_id,
                'label' => $b->label,
                'institutionId' => $b->institution_id,
                'departmentId' => $b->department_id,
                'departmentName' => $deptNames[$b->department_id] ?? $b->department_id,
                'status' => $b->status,
                'statusLabel' => self::BED_STATUS_LABELS[$b->status] ?? $b->status,
                'patientId' => $b->patient_id,
                'patientName' => $b->patient_name,
                'severity' => $b->severity,
                'severityLabel' => self::SEVERITY_LABELS[$b->severity] ?? $b->severity,
                'monitorId' => $b->monitor_id,
                'admittedAt' => $b->admitted_at?->toIso8601String(),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'summary' => $summary,
            'list' => $list,
        ];
    }

    /**
     * §3.2 获取远程查房列表（分页）
     */
    public function wards(array $filters): array
    {
        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $query = WardRound::query()
            ->when(! empty($filters['status']), fn ($q, $v) => $q->where('status', $v))
            ->when(! empty($filters['departmentId']), fn ($q, $v) => $q->where('department_id', $v))
            ->when(! empty($filters['keyword']), fn ($q, $v) => $q->where(
                fn ($sub) => $sub->where('title', 'like', "%{$v}%")
                    ->orWhere('patient_label', 'like', "%{$v}%")
                    ->orWhere('ward_label', 'like', "%{$v}%")
            ));

        $paginator = $query
            ->orderByDesc('planned_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $roundIds = collect($paginator->items())->pluck('round_id')->all();
        $noteCounts = WardRoundNote::query()
            ->whereIn('round_id', $roundIds)
            ->selectRaw('round_id, COUNT(*) as aggregate')
            ->groupBy('round_id')
            ->pluck('aggregate', 'round_id');

        $deptNames = $this->departmentNames(collect($paginator->items())->pluck('department_id')->all());

        $list = collect($paginator->items())
            ->map(fn (WardRound $r) => [
                'roundId' => $r->round_id,
                'wardId' => $r->ward_id,
                'wardLabel' => $r->ward_label,
                'departmentId' => $r->department_id,
                'departmentName' => $deptNames[$r->department_id] ?? $r->department_id,
                'patientId' => $r->patient_id,
                'patientLabel' => $r->patient_label,
                'title' => $r->title,
                'doctorId' => $r->doctor_id,
                'doctorName' => $r->doctor_name,
                'participants' => $r->participants,
                'status' => $r->status,
                'statusLabel' => self::ROUND_STATUS_LABELS[$r->status] ?? $r->status,
                'plannedAt' => $r->planned_at?->toIso8601String(),
                'startedAt' => $r->started_at?->toIso8601String(),
                'finishedAt' => $r->finished_at?->toIso8601String(),
                'summary' => $r->summary,
                'noteCount' => (int) ($noteCounts[$r->round_id] ?? 0),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * §3.3 获取床旁体征（各 ICU 床位患者最新一条）
     */
    public function vitals(array $filters): array
    {
        $departmentId = $filters['departmentId'] ?? null;

        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 50), 1), 100);

        $paginator = IcuBed::query()
            ->whereNotNull('patient_id')
            ->when($departmentId, fn ($q, $v) => $q->where('department_id', $v))
            ->orderBy('bed_id')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $beds = collect($paginator->items());
        $patientIds = $beds->pluck('patient_id')->unique()->all();

        $latest = PatientVital::query()
            ->whereIn('patient_id', $patientIds)
            ->whereRaw('measured_at = (SELECT MAX(pv.measured_at) FROM patient_vitals pv WHERE pv.patient_id = patient_vitals.patient_id)')
            ->orderByDesc('id')
            ->get()
            ->unique('patient_id')
            ->keyBy('patient_id');

        $list = $beds
            ->map(function (IcuBed $b) use ($latest) {
                $vital = $latest->get($b->patient_id);

                return [
                    'patientId' => $b->patient_id,
                    'patientName' => $b->patient_name,
                    'bedId' => $b->bed_id,
                    'bedLabel' => $b->label,
                    'heartRate' => (int) ($vital->heart_rate ?? 0),
                    'spo2' => (int) ($vital->spo2 ?? 0),
                    'resp' => (int) ($vital->resp ?? 0),
                    'temp' => (float) ($vital->temp ?? 0),
                    'systolic' => (int) ($vital->systolic ?? 0),
                    'diastolic' => (int) ($vital->diastolic ?? 0),
                    'news' => $vital?->news,
                    'newsLabel' => $this->newsLabel($vital?->news),
                    'alert' => $this->isAlert($vital),
                    'measuredAt' => $vital?->measured_at?->toIso8601String(),
                ];
            })
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * §3.4 获取智能预警（重症域，复用 warnings 主表）
     */
    public function alerts(array $filters): array
    {
        $departmentId = $filters['departmentId'] ?? 'icu';

        $pageNum = max((int) ($filters['pageNum'] ?? 1), 1);
        $pageSize = min(max((int) ($filters['pageSize'] ?? 20), 1), 100);

        $query = Warning::query()
            ->where('department_id', $departmentId)
            ->when(! empty($filters['level']), fn ($q, $v) => $q->where('level', $v));

        $activeCount = (clone $query)
            ->whereIn('status', ['new', 'acknowledged', 'treating'])
            ->count();

        if (! empty($filters['status'])) {
            $statusList = array_filter(array_map('trim', explode(',', (string) $filters['status'])));
            if ($statusList) {
                $query->whereIn('status', $statusList);
            }
        }

        $paginator = $query
            ->orderByDesc('occurred_at')
            ->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = collect($paginator->items())
            ->map(fn (Warning $w) => [
                'warningNo' => $w->warning_no,
                'patientId' => $w->patient_id,
                'patientLabel' => $w->patient_label,
                'title' => $w->title,
                'metric' => $w->metric,
                'currentValue' => $w->current_value === null ? null : (float) $w->current_value,
                'level' => $w->level,
                'levelLabel' => self::LEVEL_LABELS[$w->level] ?? $w->level,
                'status' => $w->status,
                'statusLabel' => self::STATUS_LABELS[$w->status] ?? $w->status,
                'occurredAt' => $w->occurred_at?->toIso8601String(),
            ])
            ->all();

        return [
            'updatedAt' => now()->toIso8601String(),
            'activeCount' => $activeCount,
            'total' => $paginator->total(),
            'list' => $list,
        ];
    }

    /**
     * §3.5 获取患者体征时序
     */
    public function patientVitals(string $id, array $filters): array
    {
        $patient = Patient::query()->where('patient_code', $id)->first();

        if (! $patient && ctype_digit($id)) {
            $patient = Patient::query()->find((int) $id);
        }

        $this->assert($patient instanceof Patient, ResponseCode::NOT_FOUND, '患者不存在');

        [$start, $end] = $this->resolveVitalRange($filters);

        $series = PatientVital::query()
            ->where('patient_id', $id)
            ->whereBetween('measured_at', [$start, $end])
            ->orderBy('measured_at')
            ->get()
            ->map(fn (PatientVital $v) => [
                'heartRate' => (int) $v->heart_rate,
                'spo2' => (int) $v->spo2,
                'resp' => (int) $v->resp,
                'temp' => (float) $v->temp,
                'systolic' => (int) $v->systolic,
                'diastolic' => (int) $v->diastolic,
                'news' => $v->news,
                'at' => $v->measured_at?->toIso8601String(),
            ])
            ->all();

        return [
            'patientId' => $id,
            'patientName' => $patient->real_name,
            'series' => $series,
        ];
    }

    /**
     * §3.6 写查房记录
     */
    public function wardNote(string $id, array $data): array
    {
        $round = $this->findRound($id);

        $notedAt = now();

        $note = WardRoundNote::create([
            'note_no' => $this->nextNoteNo(),
            'round_id' => $round->round_id,
            'patient_id' => $round->patient_id ?? '',
            'kind' => $data['kind'],
            'content' => $data['content'],
            'actor_id' => $data['actorId'],
            'actor_name' => $data['actorName'],
            'noted_at' => $notedAt,
        ]);

        return [
            'noteId' => $note->note_no,
            'roundId' => $round->round_id,
            'kind' => $note->kind,
            'notedAt' => $notedAt->toIso8601String(),
        ];
    }

    /**
     * 体征预警判定：news ≥ 5 或 SpO₂ < 93 或心率 > 100
     */
    private function isAlert(?PatientVital $vital): bool
    {
        if ($vital === null) {
            return false;
        }

        if ($vital->news !== null && $vital->news >= 5) {
            return true;
        }

        if ((int) $vital->spo2 > 0 && (int) $vital->spo2 < 93) {
            return true;
        }

        return (int) $vital->heart_rate > 100;
    }

    /**
     * NEWS 评分标签（无数据按正常处理）
     */
    private function newsLabel(?int $news): string
    {
        if ($news === null) {
            return '正常';
        }
        if ($news >= 7) {
            return '高危预警';
        }
        if ($news >= 5) {
            return '预警关注';
        }

        return '正常';
    }

    /**
     * 体征时序时间窗：startAt/endAt 优先，否则按 hours（缺省 24，最大 72）
     */
    private function resolveVitalRange(array $filters): array
    {
        if (! empty($filters['startAt']) || ! empty($filters['endAt'])) {
            $start = ! empty($filters['startAt']) ? Carbon::parse($filters['startAt']) : now()->subHours(24);
            $end = ! empty($filters['endAt']) ? Carbon::parse($filters['endAt']) : now();

            return [$start, $end];
        }

        $hours = min(max((int) ($filters['hours'] ?? 24), 1), 72);

        return [now()->subHours($hours), now()];
    }

    /**
     * 生成查房记录编号，如 WN-20261012-001
     */
    private function nextNoteNo(): string
    {
        $prefix = 'WN-'.now()->format('Ymd').'-';

        $seq = WardRoundNote::query()->where('note_no', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }

    /**
     * 查房会话兼容 round_id 与自增主键
     */
    private function findRound(string $id): WardRound
    {
        $round = WardRound::query()->where('round_id', $id)->first();

        if (! $round && ctype_digit($id)) {
            $round = WardRound::query()->find((int) $id);
        }

        $this->assert($round instanceof WardRound, ResponseCode::NOT_FOUND, '查房会话不存在');

        return $round;
    }

    /**
     * 批量解析科室名称（dept_code → dept_name）
     */
    private function departmentNames(array $ids): array
    {
        $ids = array_values(array_filter(array_unique($ids)));

        if ($ids === []) {
            return [];
        }

        return Department::query()->whereIn('dept_code', $ids)->pluck('dept_name', 'dept_code')->all();
    }
}
