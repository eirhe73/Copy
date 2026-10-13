<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_streams', function (Blueprint $table) {
            $table->id();
            $table->string('stream_id', 64)->unique()->comment('监控点编号，如 CAM-ICU-01');
            $table->string('name', 128)->default('')->comment('画面名称');
            $table->string('kind', 16)->default('bed')->index()->comment('类型：icu/bed/vehicle');
            $table->string('institution_id', 32)->nullable()->index();
            $table->string('department_id', 32)->nullable();
            $table->string('bed_id', 64)->nullable();
            $table->string('bed_label', 64)->nullable();
            $table->string('vehicle_id', 32)->nullable();
            $table->boolean('online')->default(false)->index();
            $table->boolean('ptz_enabled')->default(false)->comment('是否支持云台');
            $table->string('protocol', 16)->default('webrtc')->comment('拉流协议');
            $table->string('stream_url', 255)->default('');
            $table->string('fallback_url', 255)->default('');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_streams');
    }
};
