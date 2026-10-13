<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_tracks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vehicle_id')->index()->comment('车辆');
            $table->unsignedBigInteger('event_id')->nullable()->index()->comment('关联急救事件');
            $table->decimal('lng', 10, 6)->comment('经度 WGS84');
            $table->decimal('lat', 10, 6)->comment('纬度 WGS84');
            $table->decimal('speed', 6, 2)->nullable()->comment('速度 km/h');
            $table->decimal('heading', 5, 1)->nullable()->comment('航向角');
            $table->dateTime('recorded_at')->index()->comment('定位时间');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_tracks');
    }
};
