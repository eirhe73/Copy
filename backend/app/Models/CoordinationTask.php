<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 协同任务（coordination_tasks）：现场工作台 · 任务协同
 */
class CoordinationTask extends Model
{
    protected $fillable = [
        'task_id', 'title', 'kind', 'patient_id', 'patient_name',
        'source_institution_id', 'source_department_id',
        'target_institution_id', 'target_department_id',
        'assignee_id', 'assignee_name', 'vehicle_id', 'status',
        'milestones', 'started_at', 'due_at',
    ];

    protected $casts = [
        'milestones' => 'array',
        'started_at' => 'datetime',
        'due_at' => 'datetime',
    ];
}
