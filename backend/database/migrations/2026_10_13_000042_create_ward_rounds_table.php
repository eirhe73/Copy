<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ward_rounds', function (Blueprint $table) {
            $table->id();
            $table->string('round_id', 32)->unique();
            $table->string('ward_id', 32)->default('');
            $table->string('ward_label', 64)->default('');
            $table->string('institution_id', 32)->default('');
            $table->string('department_id', 32)->default('');
            $table->string('patient_id', 32)->nullable();
            $table->string('patient_label', 64)->default('');
            $table->string('title', 128)->default('');
            $table->string('doctor_id', 32)->default('');
            $table->string('doctor_name', 64)->default('');
            $table->string('participants', 255)->default('');
            $table->string('status', 16)->default('scheduled')->comment('scheduled/in_progress/finished');
            $table->dateTime('planned_at');
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->string('summary', 255)->default('');
            $table->timestamps();

            $table->index(['department_id', 'status', 'planned_at']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ward_rounds');
    }
};
