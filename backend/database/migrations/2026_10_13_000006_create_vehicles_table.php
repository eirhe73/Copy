<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number', 20)->unique()->comment('车牌号');
            $table->string('vehicle_type', 50)->default('AMBULANCE')->comment('车辆类型');
            $table->unsignedBigInteger('org_id')->index()->comment('所属机构');
            $table->string('vehicle_status', 30)->default('VEHICLE_STANDBY')->index()->comment('状态：出警中/站内待命');
            $table->string('driver_name', 100)->nullable();
            $table->string('driver_phone', 50)->nullable();
            $table->decimal('latest_lng', 10, 6)->nullable()->comment('最新经度');
            $table->decimal('latest_lat', 10, 6)->nullable()->comment('最新纬度');
            $table->dateTime('latest_at')->nullable()->comment('最新定位时间');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
