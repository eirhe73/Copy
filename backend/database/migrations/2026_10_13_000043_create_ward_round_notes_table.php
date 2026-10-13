<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ward_round_notes', function (Blueprint $table) {
            $table->id();
            $table->string('note_no', 32)->nullable()->unique()->comment('记录编号，如 WN-20261012-001');
            $table->string('round_id', 32)->index();
            $table->string('patient_id', 32)->default('');
            $table->string('kind', 32)->default('查房意见');
            $table->text('content')->nullable();
            $table->string('actor_id', 32)->default('');
            $table->string('actor_name', 64)->default('');
            $table->dateTime('noted_at');
            $table->timestamps();

            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ward_round_notes');
    }
};
