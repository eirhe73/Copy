<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warning_closed_loop', function (Blueprint $table) {
            $table->id();
            $table->string('stage', 32)->comment('阶段：预警触发/护士确认/医生到床/干预完成');
            $table->unsignedInteger('count')->default(0);
            $table->date('stat_date')->comment('统计日期');
            $table->timestamps();

            $table->unique(['stage', 'stat_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warning_closed_loop');
    }
};
