<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('care_centers', function (Blueprint $table) {
            $table->id();
            $table->string('center_id', 32)->unique();
            $table->string('name', 64)->default('');
            $table->string('lead_dept', 32)->default('');
            $table->json('related_depts')->nullable();
            $table->string('status', 16)->default('active');
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['status', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('care_centers');
    }
};
