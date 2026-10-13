<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_standards', function (Blueprint $table) {
            $table->id();
            $table->string('version', 20)->index()->comment('标准版本，如 2026-Q4');
            $table->string('standard_name', 200)->comment('标准名称');
            $table->string('category', 100)->nullable()->comment('标准分类');
            $table->decimal('target_rate', 5, 4)->nullable()->comment('目标合规率 0-1');
            $table->unsignedInteger('sort')->default(0)->comment('排序');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->timestamps();

            $table->unique(['version', 'standard_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_standards');
    }
};
