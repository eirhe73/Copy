<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id', 64)->unique();
            $table->string('title', 128)->default('');
            $table->string('text', 500)->default('');
            $table->boolean('is_read')->default(false);
            $table->string('patient_id', 64)->nullable();
            $table->string('patient_name', 64)->nullable();
            $table->string('category', 16)->default('')->comment('alert/consult/transfer');
            $table->string('link', 255)->default('');
            $table->dateTime('at');
            $table->timestamps();

            $table->index(['is_read', 'at']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
