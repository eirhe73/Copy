<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_locations', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_id', 32)->index()->comment('车辆编号');
            $table->decimal('lng', 10, 6)->default(0)->comment('经度');
            $table->decimal('lat', 10, 6)->default(0)->comment('纬度');
            $table->unsignedInteger('speed_kmh')->default(0)->comment('速度 km/h');
            $table->smallInteger('heading')->default(0)->comment('朝向 0-360');
            $table->string('destination', 64)->default('')->comment('目的地医院');
            $table->unsignedInteger('eta_minutes')->nullable()->comment('预计到院分钟');
            $table->json('route')->nullable()->comment('轨迹折线 [[lng,lat],...]');
            $table->dateTime('located_at')->comment('定位上报时间');
            $table->timestamp('updated_at')->nullable();

            $table->index(['vehicle_id', 'located_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_locations');
    }
};
