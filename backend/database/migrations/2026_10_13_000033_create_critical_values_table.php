<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('critical_values', function (Blueprint $table) {
            $table->id();
            $table->string('critical_no', 32)->unique()->comment('危急值编号');
            $table->string('patient_id', 32)->index();
            $table->string('patient_label', 64)->default('');
            $table->string('item_name', 64)->default('')->comment('检验项目');
            $table->string('result_value', 64)->default('');
            $table->string('unit', 16)->default('');
            $table->string('ref_range', 64)->default('');
            $table->string('critical_range', 64)->default('');
            $table->string('specimen', 32)->default('');
            $table->string('level', 16)->default('urgent');
            $table->string('status', 16)->default('pending')->comment('状态：pending/notified/handled');
            $table->string('institution_id', 32)->nullable();
            $table->string('department_id', 32)->nullable();
            $table->dateTime('reported_at');
            $table->timestamps();

            $table->index(['status', 'reported_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('critical_values');
    }
};
