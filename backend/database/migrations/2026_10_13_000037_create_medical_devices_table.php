<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id', 64)->unique();
            $table->string('name', 32)->default('监护仪');
            $table->string('bed_id', 64)->nullable()->index();
            $table->string('bed_label', 64)->nullable();
            $table->string('patient_id', 64)->nullable();
            $table->string('patient_name', 64)->nullable();
            $table->boolean('online')->default(false);
            $table->boolean('alarm')->default(false);
            $table->dateTime('bound_at')->nullable();
            $table->string('previous_bed_id', 64)->nullable();
            $table->dateTime('unbound_at')->nullable();
            $table->timestamps();

            $table->index(['online', 'alarm']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_devices');
    }
};
