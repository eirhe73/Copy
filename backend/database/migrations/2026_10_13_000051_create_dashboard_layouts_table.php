<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_layouts', function (Blueprint $table) {
            $table->id();
            $table->string('scope', 16)->default('default')->comment('作用域：default全局/role角色/user个人');
            $table->string('role_key', 32)->nullable()->comment('scope=role 时的角色键，如 doctor/director');
            $table->unsignedBigInteger('user_id')->nullable()->comment('scope=user 时的用户ID');
            $table->json('layout')->comment('面板布局配置（显隐/顺序/尺寸/锁定）');
            $table->unsignedInteger('version')->default(1)->comment('乐观锁版本号');
            $table->timestamps();

            $table->unique(['scope', 'role_key', 'user_id'], 'uk_scope_owner');
            $table->index('user_id', 'idx_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_layouts');
    }
};
