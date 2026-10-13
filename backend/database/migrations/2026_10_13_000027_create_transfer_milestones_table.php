<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_milestones', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_no', 64)->index()->comment('转运任务编号');
            $table->string('milestone_key', 32)->comment('节点：accepted/on-scene/onboard/arrived/handover');
            $table->string('milestone_label', 64)->default('')->comment('节点显示名');
            $table->dateTime('occurred_at')->comment('节点时间');
            $table->string('actor', 64)->default('')->comment('操作人');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_milestones');
    }
};
