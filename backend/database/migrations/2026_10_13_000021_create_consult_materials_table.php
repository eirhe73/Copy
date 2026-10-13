<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_materials', function (Blueprint $table) {
            $table->id();
            $table->string('material_no', 32)->unique()->comment('资料编号，如 MAT-1001');
            $table->string('session_id', 64)->index()->comment('会诊会话编号');
            $table->string('kind', 32)->default('')->comment('类型：护理记录/检验记录/用药记录/评估记录/病程记录');
            $table->string('title', 128)->default('');
            $table->text('content')->nullable();
            $table->string('source', 16)->default('local')->comment('来源：local/his/emr/lis');
            $table->string('author_name', 64)->default('');
            $table->dateTime('shared_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_materials');
    }
};
