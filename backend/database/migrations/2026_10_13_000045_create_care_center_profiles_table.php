<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('care_center_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('center_id', 32);
            $table->string('org_id', 32)->default('');
            $table->unsignedInteger('visible_patients')->default(0);
            $table->unsignedInteger('pending_transfer')->default(0);
            $table->unsignedInteger('team_size')->default(0);
            $table->json('equipment')->nullable();
            $table->unsignedInteger('annual_volume')->default(0);
            $table->decimal('pathway_rate', 5, 4)->default(0);
            $table->string('assessment_note', 255)->default('');
            $table->dateTime('profiled_at');
            $table->timestamps();

            $table->unique(['center_id', 'org_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('care_center_profiles');
    }
};
