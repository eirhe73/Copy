<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrganizationController extends Controller
{
    /**
     * 机构列表（转诊双方 / 受理机构下拉选项）
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Organization::query();

        $query->when($request->input('org_type'), fn ($q, $v) => $q->where('org_type', $v))
            ->when($request->input('county_name'), fn ($q, $v) => $q->where('county_name', $v))
            ->when($request->input('keyword'), fn ($q, $v) => $q->where('org_name', 'like', "%{$v}%"));

        $organizations = $query->orderBy('org_code')
            ->paginate($request->integer('per_page', 50))
            ->appends($request->query());

        return OrganizationResource::collection($organizations);
    }

    /**
     * 机构详情
     */
    public function show(Organization $organization): OrganizationResource
    {
        return new OrganizationResource($organization);
    }
}
