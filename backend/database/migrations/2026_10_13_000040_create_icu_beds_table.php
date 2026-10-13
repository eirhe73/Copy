<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('icu_beds', function (Blueprint $table) {
            $table->id();
            $table->string('bed_id', 32)->unique();
            $table->string('label', 16)->default('');
            $table->string('institution_id', 32)->default('');
            $table->string('department_id', 32)->default('');
            $table->string('status', 16)->default('available')->comment('available/occupied');
            $table->string('patient_id', 32)->nullable();
            $table->string('patient_name', 64)->default('');
            $table->string('severity', 16)->default('')->comment('critical/acute/general');
            $table->string('monitor_id', 32)->nullable();
            $table->dateTime('admitted_at')->nullable();
            $table->timestamps();

            $table->index(['department_id', 'status']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('icu_beds');
    }
};
