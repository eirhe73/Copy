<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends BaseModel
{
    protected $fillable = ['org_id', 'dept_code', 'dept_name'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }
}
