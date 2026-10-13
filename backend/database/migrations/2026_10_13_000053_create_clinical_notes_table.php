<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 患者临床记录表（03-患者与床位/02-患者管理接口 §2.3）
        Schema::create('clinical_notes', function (Blueprint $table) {
            $table->id();
            $table->string('note_id', 64)->unique()->comment('记录唯一编号');
            $table->string('patient_id', 32)->comment('患者编号');
            $table->string('kind', 16)->default('')->comment('类型：护理记录/检验记录/用药记录/评估记录');
            $table->string('title', 128)->default('')->comment('标题');
            $table->text('text')->nullable()->comment('正文');
            $table->dateTime('at')->comment('记录时间');
            $table->string('actor_id', 32)->nullable()->comment('记录人编号');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['patient_id', 'at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinical_notes');
    }
};
