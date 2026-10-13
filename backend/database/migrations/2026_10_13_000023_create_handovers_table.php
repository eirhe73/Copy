<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('handovers', function (Blueprint $table) {
            $table->id();
            $table->string('handover_no', 32)->unique()->comment('交接单号，如 HO-20260924-001');
            $table->string('transfer_no', 64)->nullable()->index()->comment('转运任务编号');
            $table->string('event_id', 64)->nullable()->index()->comment('事件编号');
            $table->string('task120_id', 32)->nullable()->comment('120 任务号');
            $table->string('patient_id', 64)->default('')->comment('患者编号');
            $table->string('patient_name', 64)->default('');
            $table->string('from_staff_id', 64)->default('')->comment('交接方账号');
            $table->string('from_staff_name', 64)->default('');
            $table->string('to_staff_id', 64)->nullable()->comment('接收方账号');
            $table->string('to_staff_name', 64)->nullable();
            $table->string('to_dept', 64)->nullable()->comment('接收科室');
            $table->json('items')->nullable()->comment('交接明细');
            $table->string('signature', 32)->default('')->comment('签收标记');
            $table->dateTime('handover_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handovers');
    }
};
