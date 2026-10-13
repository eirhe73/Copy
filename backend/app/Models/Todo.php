<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    protected $fillable = [
        'todo_id', 'title', 'hint', 'tone', 'go', 'priority', 'status', 'at',
    ];

    protected $casts = [
        'at' => 'datetime',
    ];
}
