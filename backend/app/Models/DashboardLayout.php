<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardLayout extends Model
{
    protected $fillable = [
        'scope', 'role_key', 'user_id', 'layout', 'version',
    ];

    protected $casts = [
        'layout' => 'array',
        'user_id' => 'integer',
        'version' => 'integer',
    ];
}
