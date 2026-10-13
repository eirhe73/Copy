<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('notification_id', 64)->unique();
            $table->string('title', 128)->default('');
            $table->string('text', 500)->default('');
            $table->boolean('is_read')->default(false);
            $table->string('patient_name', 64)->default('');
            $table->string('channel', 16)->default('wechat')->comment('wechat/sms');
            $table->string('token', 128)->nullable();
            $table->dateTime('at');
            $table->timestamps();

            $table->index(['channel', 'is_read']);
            $table->index('at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
