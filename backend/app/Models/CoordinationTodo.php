<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 协同待办（coordination_todos）：现场工作台 · 移动会诊待办
 */
class CoordinationTodo extends Model
{
    protected $fillable = [
        'todo_id', 'assignee_id', 'title', 'hint', 'tone', 'kind',
        'patient_id', 'patient_name', 'journey_id', 'token',
        'source_institution_id', 'source_department_id',
        'target_institution_id', 'target_department_id',
        'priority', 'status', 'at', 'due_at',
    ];

    protected $casts = [
        'at' => 'datetime',
        'due_at' => 'datetime',
    ];
}
