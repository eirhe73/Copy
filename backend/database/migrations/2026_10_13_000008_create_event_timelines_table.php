<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_timelines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id')->index()->comment('所属急救事件');
            $table->string('node_type', 50)->comment('节点类型：接警/派车/到现场/到院等');
            $table->string('node_title', 200)->comment('节点标题');
            $table->text('content')->nullable()->comment('节点详情');
            $table->dateTime('occurred_at')->comment('节点发生时间');
            $table->unsignedBigInteger('operator_user_id')->nullable()->comment('操作人');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_timelines');
    }
};
