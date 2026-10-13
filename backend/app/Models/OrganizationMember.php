<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 机构成员（organization_members）：公开医护资料 / 本科室人员
 */
class OrganizationMember extends Model
{
    protected $fillable = [
        'member_id', 'org_code', 'name', 'title', 'profession', 'dept_id', 'work_areas', 'evidence_as_of',
    ];

    protected $casts = [
        'work_areas' => 'array',
    ];
}
