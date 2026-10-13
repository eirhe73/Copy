<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 认证模块补充字段（01-认证接口.md §2.1）
 *
 * 现有 users 表沿用 org_id / real_name / user_status 等旧列，
 * 此处仅补 role_view / profession / member_id / department_id 四个缺失列。
 */
return new class extends Migration
{
    private const COLUMNS = ['role_view', 'profession', 'member_id', 'department_id'];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role_view')) {
                $table->string('role_view', 16)->default('doctor')->after('identity_type')->comment('数据权限角色：doctor/director');
            }

            if (! Schema::hasColumn('users', 'profession')) {
                $table->string('profession', 16)->default('')->after('role_view')->comment('职业：doctor/nurse');
            }

            if (! Schema::hasColumn('users', 'member_id')) {
                $table->string('member_id', 64)->nullable()->after('profession')->comment('关联 organization_members.member_id');
            }

            if (! Schema::hasColumn('users', 'department_id')) {
                $table->string('department_id', 32)->default('')->after('member_id')->comment('所属科室编码');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (self::COLUMNS as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
