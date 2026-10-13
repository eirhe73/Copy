<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bed_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('inspection_id', 32)->unique();
            $table->string('bed_id', 64);
            $table->string('institution_id', 32)->default('');
            $table->string('department_id', 32)->default('');
            $table->string('inspector_id', 32)->default('');
            $table->string('inspector_name', 64)->default('');
            $table->string('kind', 16)->default('routine')->comment('routine常规/handover交接');
            $table->dateTime('inspect_at');
            $table->json('items')->nullable();
            $table->string('result', 16)->default('normal')->comment('normal正常/abnormal异常');
            $table->string('remark', 255)->default('');
            $table->timestamps();

            $table->index(['bed_id', 'inspect_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bed_inspections');
    }
};
