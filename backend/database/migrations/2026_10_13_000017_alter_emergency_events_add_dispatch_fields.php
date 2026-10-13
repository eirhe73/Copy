<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emergency_events', function (Blueprint $table) {
            $table->string('task120_id', 32)->nullable()->unique()->comment('120 任务号');
            $table->unsignedTinyInteger('level')->default(1)->comment('等级：0重症1急症2一般');
            $table->string('destination', 64)->default('')->comment('目标医院');
            $table->string('vehicle_id', 32)->default('')->index()->comment('车辆编号');
            $table->string('vehicle_plate', 16)->default('')->comment('车牌');
            $table->unsignedTinyInteger('status')->default(1)->index()->comment('状态：0待命1出警中2现场处置3返院途中');
            $table->dateTime('started_at')->nullable()->index()->comment('出警时间');
            $table->unsignedInteger('eta_hospital_minutes')->default(0)->comment('预计到院分钟');
            $table->unsignedInteger('eta_patient_minutes')->nullable()->comment('预计到患者分钟');
            $table->string('score_plan', 255)->default('')->comment('院前评分方案');
            $table->text('treat_plan')->nullable()->comment('救治方案');
        });
    }

    public function down(): void
    {
        Schema::table('emergency_events', function (Blueprint $table) {
            $table->dropColumn([
                'task120_id', 'level', 'destination', 'vehicle_id', 'vehicle_plate', 'status',
                'started_at', 'eta_hospital_minutes', 'eta_patient_minutes', 'score_plan', 'treat_plan',
            ]);
        });
    }
};
