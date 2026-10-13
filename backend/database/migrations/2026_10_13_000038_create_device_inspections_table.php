<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('inspection_id', 64)->unique();
            $table->string('device_id', 64);
            $table->string('item', 64)->default('')->comment('巡检项');
            $table->string('result', 16)->default('ok')->comment('ok正常/fault异常');
            $table->string('inspector', 64)->default('');
            $table->dateTime('check_at');
            $table->string('note', 255)->default('');
            $table->timestamps();

            $table->index(['device_id', 'check_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_inspections');
    }
};
