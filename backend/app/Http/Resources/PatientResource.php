<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_code' => $this->patient_code,
            'real_name' => $this->real_name,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'age' => $this->age,
            'id_card' => $this->id_card,
            'phone' => $this->phone,
            'address' => $this->address,
            'medical_history' => $this->medical_history,
            'allergy_history' => $this->allergy_history,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
