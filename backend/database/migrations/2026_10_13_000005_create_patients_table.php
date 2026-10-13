<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code', 50)->unique()->comment('患者编号');
            $table->string('real_name', 100)->comment('姓名');
            $table->string('gender', 20)->default('GENDER_UNKNOWN')->comment('性别');
            $table->date('birth_date')->nullable();
            $table->unsignedInteger('age')->nullable();
            $table->string('id_card', 30)->nullable()->index()->comment('身份证号');
            $table->string('phone', 50)->nullable();
            $table->string('address', 500)->nullable();
            $table->text('medical_history')->nullable()->comment('既往史');
            $table->text('allergy_history')->nullable()->comment('过敏史');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
