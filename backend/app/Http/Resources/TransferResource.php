<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transfer_code' => $this->transfer_code,
            'event_id' => $this->event_id,
            'patient_id' => $this->patient_id,
            'urgency_level' => $this->urgency_level,
            'transfer_reason' => $this->transfer_reason,
            'diagnosis' => $this->diagnosis,
            'trigger_source' => $this->trigger_source,
            'transfer_status' => $this->transfer_status,
            'confirm_status' => $this->confirm_status,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'reject_reason' => $this->reject_reason,
            'review_note' => $this->review_note,
            'driver_name' => $this->driver_name,
            'eta' => $this->eta?->toIso8601String(),
            'latest_vitals' => $this->latest_vitals,
            'resource_prep' => $this->resource_prep,
            'handover_status' => $this->handover_status,
            'initiator_user_id' => $this->initiator_user_id,
            'from_org' => new OrganizationResource($this->whenLoaded('fromOrg')),
            'to_org' => new OrganizationResource($this->whenLoaded('toOrg')),
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'vehicle' => new VehicleResource($this->whenLoaded('vehicle')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
