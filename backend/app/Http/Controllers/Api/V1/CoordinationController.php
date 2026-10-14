<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CoordinationTask;
use App\Models\CoordinationTodo;
use App\Support\Result;
use Illuminate\Http\Request;

class CoordinationController extends Controller
{
    /**
     * §3.1 移动会诊待办（待会诊 / 待接收 / 待核实 / 待确认）
     */
    public function todos(Request $request): array
    {
        $pageNum = max((int) ($request->input('pageNum', 1)), 1);
        $pageSize = min(max((int) ($request->input('pageSize', 50)), 1), 100);

        $query = CoordinationTodo::query()
            ->when($request->input('status'), function ($q, $v) {
                $status = array_filter(array_map('trim', explode(',', (string) $v)));
                if ($status) {
                    $q->whereIn('status', $status);
                }
            })
            ->when($request->input('kind'), fn ($q, $v) => $q->where('kind', $v));

        $openCount = (clone $query)->where('status', 'open')->count();

        $paginator = $query->orderByDesc('at')->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = $paginator->getCollection()->map(fn (CoordinationTodo $t) => [
            'todoId' => $t->todo_id,
            'assigneeId' => $t->assignee_id,
            'title' => $t->title,
            'hint' => $t->hint,
            'tone' => $t->tone,
            'kind' => $t->kind,
            'patientId' => $t->patient_id,
            'patientName' => $t->patient_name,
            'journeyId' => $t->journey_id,
            'token' => $t->token,
            'sourceInstitutionId' => $t->source_institution_id,
            'sourceDepartmentId' => $t->source_department_id,
            'targetInstitutionId' => $t->target_institution_id,
            'targetDepartmentId' => $t->target_department_id,
            'priority' => $t->priority,
            'status' => $t->status,
            'at' => $t->at?->toIso8601String(),
            'dueAt' => $t->due_at?->toIso8601String(),
        ])->all();

        return Result::success('获取成功', [
            'openCount' => $openCount,
            'total' => $paginator->total(),
            'list' => $list,
        ]);
    }

    /**
     * §3.2 任务协同（转运 / 会诊 / 交接 / 评估）
     */
    public function tasks(Request $request): array
    {
        $pageNum = max((int) ($request->input('pageNum', 1)), 1);
        $pageSize = min(max((int) ($request->input('pageSize', 50)), 1), 100);

        $query = CoordinationTask::query()
            ->when($request->input('status'), function ($q, $v) {
                $status = array_filter(array_map('trim', explode(',', (string) $v)));
                if ($status) {
                    $q->whereIn('status', $status);
                }
            })
            ->when($request->input('kind'), fn ($q, $v) => $q->where('kind', $v));

        $paginator = $query->orderByDesc('created_at')->paginate($pageSize, ['*'], 'pageNum', $pageNum);

        $list = $paginator->getCollection()->map(fn (CoordinationTask $t) => [
            'taskId' => $t->task_id,
            'title' => $t->title,
            'kind' => $t->kind,
            'patientId' => $t->patient_id,
            'patientName' => $t->patient_name,
            'sourceInstitutionId' => $t->source_institution_id,
            'sourceDepartmentId' => $t->source_department_id,
            'targetInstitutionId' => $t->target_institution_id,
            'targetDepartmentId' => $t->target_department_id,
            'assigneeId' => $t->assignee_id,
            'assigneeName' => $t->assignee_name,
            'vehicleId' => $t->vehicle_id,
            'status' => $t->status,
            'milestones' => $t->milestones,
            'startedAt' => $t->started_at?->toIso8601String(),
            'dueAt' => $t->due_at?->toIso8601String(),
        ])->all();

        return Result::success('获取成功', [
            'total' => $paginator->total(),
            'list' => $list,
        ]);
    }
}
