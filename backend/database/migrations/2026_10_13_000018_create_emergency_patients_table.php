<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emergency_patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_no', 32)->nullable()->unique()->comment('登记编号，如 PAT-20261013-001');
            $table->string('event_id', 32)->nullable()->comment('关联事件编号');
            $table->string('task120_id', 32)->nullable()->comment('120 任务号');
            $table->string('vehicle_id', 32)->nullable()->comment('车辆编号');
            $table->string('vehicle_plate', 16)->default('')->comment('车牌');
            $table->string('name', 64)->default('')->comment('患者姓名');
            $table->unsignedTinyInteger('gender')->default(0)->comment('性别：0男1女');
            $table->unsignedInteger('age')->default(0)->comment('年龄');
            $table->string('phone', 20)->default('')->comment('联系电话');
            $table->string('chief_complaint', 255)->default('')->comment('主诉');
            $table->unsignedTinyInteger('is_draft')->default(0)->comment('是否草稿：1草稿0已提交');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('task120_id');
            $table->index('event_id');
            $table->index('vehicle_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_patients');
    }
};
