<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('care_bindings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('scope')->default(0)->comment('0本院1协作医院2下级医院');
            $table->string('hospital', 64)->default('');
            $table->string('ward', 64)->default('');
            $table->string('bed_id', 64)->default('')->index();
            $table->string('bed_label', 64)->default('');
            $table->string('patient_id', 64)->default('')->index();
            $table->string('patient_name', 64)->default('');
            $table->string('device_id', 64)->nullable()->index();
            $table->string('device_name', 32)->nullable();
            $table->string('camera_id', 64)->nullable();
            $table->dateTime('bound_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('care_bindings');
    }
};
