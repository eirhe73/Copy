<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->string('from_institution_id', 32)->nullable()->comment('转出机构编号');
            $table->string('to_institution_id', 32)->nullable()->comment('转入机构编号');
            $table->string('doctor_id', 64)->nullable()->comment('随车医生账号');
            $table->string('nurse_id', 64)->nullable()->comment('随车护士账号');
            $table->dateTime('started_at')->nullable()->comment('开始转运时间');
            $table->dateTime('arrived_at')->nullable()->comment('到达时间');
            $table->dateTime('handover_at')->nullable()->comment('交接时间');
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropColumn(['from_institution_id', 'to_institution_id', 'doctor_id', 'nurse_id', 'started_at', 'arrived_at', 'handover_at']);
        });
    }
};
