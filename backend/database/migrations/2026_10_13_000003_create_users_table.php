<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 按原系统表结构还原
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('org_id')->nullable()->index()->comment('所属机构');
            $table->string('real_name', 100)->comment('真实姓名');
            $table->string('username', 100)->unique()->comment('登录账号');
            $table->string('password_hash', 255)->comment('密码哈希');
            $table->string('phone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('identity_type', 50)->index()->comment('身份类型：医生/护士/调度员等');
            $table->string('role_view', 16)->default('doctor')->comment('数据权限角色：doctor/director');
            $table->string('profession', 16)->default('')->comment('职业：doctor/nurse');
            $table->string('member_id', 64)->nullable()->comment('关联 organization_members.member_id');
            $table->string('department_id', 32)->default('')->comment('所属科室编码');
            $table->string('home_route', 200)->nullable()->comment('登录后默认路由');
            $table->string('user_status', 20)->default('USER_ACTIVE')->index()->comment('用户状态');
            $table->dateTime('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
