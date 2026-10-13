<?php

use App\Http\Controllers\Api\V1\ClinicalRecordController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\EmergencyEventController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\QcIssueController;
use App\Http\Controllers\Api\V1\QcStandardController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 健康检查：访问 GET /api/health 验证后端可达
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'huaxi-command-center-backend',
        'time' => now()->toIso8601String(),
    ]);
});

/*
| V1 业务接口
*/
Route::prefix('v1')->group(function () {

    // 机构（转诊双方 / 受理机构选项）
    Route::apiResource('organizations', OrganizationController::class)->only(['index', 'show']);

    // 患者建档
    Route::apiResource('patients', PatientController::class);

    // 急救事件（实时出警 / 急救事件 / 患者登记）
    Route::apiResource('emergency-events', EmergencyEventController::class);
    Route::post('emergency-events/{emergency_event}/close', [EmergencyEventController::class, 'close']);

    // 基层调度链：转诊单
    Route::apiResource('transfers', TransferController::class);
    Route::post('transfers/{transfer}/confirm', [TransferController::class, 'confirm']);
    Route::post('transfers/{transfer}/reject', [TransferController::class, 'reject']);

    // 救护车
    Route::apiResource('vehicles', VehicleController::class);
    Route::get('vehicles-gps', [VehicleController::class, 'gps']);
    Route::get('vehicles/{vehicle}/tracks', [VehicleController::class, 'tracks']);

    // 医院质控：标准（summary 需在 apiResource 之前注册，避免被 show 捕获）
    Route::get('qc-standards/summary', [QcStandardController::class, 'summary']);
    Route::apiResource('qc-standards', QcStandardController::class);

    // 医院质控：整改单
    Route::apiResource('qc-issues', QcIssueController::class);
    Route::post('qc-issues/{qc_issue}/close', [QcIssueController::class, 'close']);

    // 基层医生 Dr：医生管理 + 诊疗记录
    Route::apiResource('doctors', DoctorController::class);
    Route::apiResource('clinical-records', ClinicalRecordController::class);
});
