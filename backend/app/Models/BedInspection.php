<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BedInspection extends Model
{
    protected $fillable = [
        'inspection_id', 'bed_id', 'institution_id', 'department_id',
        'inspector_id', 'inspector_name', 'kind', 'inspect_at', 'items', 'result', 'remark',
    ];

    protected $casts = [
        'inspect_at' => 'datetime',
        'items' => 'array',
    ];
}
