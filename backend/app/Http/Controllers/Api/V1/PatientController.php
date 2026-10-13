<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PatientController extends Controller
{
    /**
     * 患者列表
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Patient::query();

        $query->when($request->input('keyword'), function ($q, $v) {
            $q->where(function ($sub) use ($v) {
                $sub->where('real_name', 'like', "%{$v}%")
                    ->orWhere('patient_code', 'like', "%{$v}%")
                    ->orWhere('id_card', 'like', "%{$v}%")
                    ->orWhere('phone', 'like', "%{$v}%");
            });
        });

        $patients = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PatientResource::collection($patients);
    }

    /**
     * 患者建档
     */
    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = Patient::create($request->validated());
        $patient->refresh();

        return (new PatientResource($patient))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * 患者详情
     */
    public function show(Patient $patient): PatientResource
    {
        return new PatientResource($patient);
    }

    /**
     * 更新患者信息
     */
    public function update(UpdatePatientRequest $request, Patient $patient): PatientResource
    {
        $patient->update($request->validated());

        return new PatientResource($patient);
    }

    /**
     * 删除患者（软删除）
     */
    public function destroy(Patient $patient): Response
    {
        $patient->delete();

        return response()->noContent();
    }
}
