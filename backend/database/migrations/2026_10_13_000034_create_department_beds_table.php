<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_beds', function (Blueprint $table) {
            $table->id();
            $table->string('hospital_id', 32)->default('');
            $table->string('dept_id', 32);
            $table->string('name', 64)->default('');
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('occupied')->default(0);
            $table->unsignedInteger('reserved')->default(0);
            $table->unsignedInteger('free')->default(0);
            $table->timestamps();

            $table->unique(['hospital_id', 'dept_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_beds');
    }
};
