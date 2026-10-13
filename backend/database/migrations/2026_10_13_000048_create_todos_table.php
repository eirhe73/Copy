<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('todos', function (Blueprint $table) {
            $table->id();
            $table->string('todo_id', 64)->unique();
            $table->string('title', 128)->default('');
            $table->string('hint', 255)->default('');
            $table->string('tone', 16)->default('warn')->comment('warn/danger/default');
            $table->string('go', 255)->default('');
            $table->string('priority', 8)->default('P0')->comment('P0/P1');
            $table->string('status', 16)->default('open')->comment('open/done');
            $table->dateTime('at');
            $table->timestamps();

            $table->index(['priority', 'status']);
            $table->index('at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('todos');
    }
};
