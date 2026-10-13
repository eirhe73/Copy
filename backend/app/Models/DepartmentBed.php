<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentBed extends Model
{
    protected $fillable = [
        'hospital_id', 'dept_id', 'name', 'total', 'occupied', 'reserved', 'free',
    ];

    protected $casts = [
        'total' => 'integer',
        'occupied' => 'integer',
        'reserved' => 'integer',
        'free' => 'integer',
    ];
}
