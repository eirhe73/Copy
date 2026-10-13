<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'org_code' => $this->org_code,
            'org_name' => $this->org_name,
            'org_type' => $this->org_type,
            'county_name' => $this->county_name,
            'address' => $this->address,
            'lng' => $this->lng,
            'lat' => $this->lat,
            'contact_phone' => $this->contact_phone,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
