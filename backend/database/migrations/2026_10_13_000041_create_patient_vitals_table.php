<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_vitals', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id', 32)->index();
            $table->unsignedSmallInteger('heart_rate')->default(0);
            $table->unsignedSmallInteger('spo2')->default(0);
            $table->unsignedSmallInteger('resp')->default(0);
            $table->decimal('temp', 3, 1)->default(0);
            $table->unsignedSmallInteger('systolic')->default(0);
            $table->unsignedSmallInteger('diastolic')->default(0);
            $table->smallInteger('news')->nullable();
            $table->string('source', 16)->default('device');
            $table->dateTime('measured_at');
            $table->timestamps();

            $table->index(['patient_id', 'measured_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_vitals');
    }
};
