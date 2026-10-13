<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('vehicle_id', 32)->nullable()->unique()->after('id')->comment('车辆编号，如 AMB-1');
            $table->string('bound_hospital', 64)->default('')->comment('绑定医院');
            $table->string('crew', 64)->default('')->comment('随车班组');
            $table->unsignedTinyInteger('status')->default(0)->index()->comment('状态：0待命1出警中2现场处置3返院途中');
            $table->string('current_event_id', 32)->nullable()->index()->comment('当前关联急救事件编号');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['vehicle_id', 'bound_hospital', 'crew', 'status', 'current_event_id']);
        });
    }
};
