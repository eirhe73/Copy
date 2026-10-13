<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('org_id')->index()->comment('所属机构');
            $table->string('dept_code', 50)->comment('科室编码');
            $table->string('dept_name', 100)->comment('科室名称');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->unique(['org_id', 'dept_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
