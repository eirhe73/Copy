<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareCenter extends Model
{
    protected $fillable = [
        'center_id', 'name', 'lead_dept', 'related_depts', 'status', 'sort',
    ];

    protected $casts = [
        'related_depts' => 'array',
        'sort' => 'integer',
    ];
}
