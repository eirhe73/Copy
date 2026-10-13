<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warning_dispose_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('warning_id')->index()->comment('关联 warnings.id');
            $table->string('warning_no', 32)->default('');
            $table->string('stage', 32)->comment('阶段');
            $table->string('note', 255)->default('');
            $table->string('actor_id', 32)->default('');
            $table->string('actor_name', 64)->default('');
            $table->dateTime('acted_at')->comment('操作时间');
            $table->timestamps();

            $table->index(['stage', 'acted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warning_dispose_records');
    }
};
