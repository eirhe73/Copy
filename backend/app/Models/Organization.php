<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends BaseModel
{
    protected $fillable = [
        'org_code', 'org_name', 'org_type', 'county_name',
        'address', 'lng', 'lat', 'contact_phone',
        'short_name', 'level', 'province', 'city', 'town',
        'verified', 'current_operation_verified', 'verification_scope', 'tier',
    ];

    protected $casts = [
        'lng' => 'decimal:6',
        'lat' => 'decimal:6',
        'verified' => 'boolean',
        'current_operation_verified' => 'boolean',
        'tier' => 'integer',
        'is_deleted' => 'boolean',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'org_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'org_id');
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'org_id');
    }
}
