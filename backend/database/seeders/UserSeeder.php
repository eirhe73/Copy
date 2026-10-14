<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * 用户账号基础数据
 *
 * identity_type：DOCTOR/NURSE/DISPATCHER/AMBULANCE
 * role_view：doctor/director；profession：doctor/nurse
 * 统一密码 123456（bcrypt），含 admin 账号
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $hash = Hash::make('123456');

        DB::table('users')->insert([
            [
                'id' => 1, 'org_id' => 1, 'real_name' => '系统管理员', 'username' => 'admin',
                'password_hash' => $hash, 'phone' => '13800000001', 'email' => 'admin@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'director', 'profession' => 'doctor',
                'member_id' => 'M-HX-001', 'department_id' => 'EMERGENCY',
                'home_route' => '/dashboard', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 2, 'org_id' => 2, 'real_name' => '王建国', 'username' => 'doctor_wang',
                'password_hash' => $hash, 'phone' => '13800000002', 'email' => 'wang@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'doctor', 'profession' => 'doctor',
                'member_id' => 'M-WY-002', 'department_id' => 'EMERGENCY',
                'home_route' => '/dispatch', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'org_id' => 1, 'real_name' => '刘敏', 'username' => 'doctor_liu',
                'password_hash' => $hash, 'phone' => '13800000003', 'email' => 'liu@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'doctor', 'profession' => 'doctor',
                'member_id' => 'M-HX-003', 'department_id' => 'NEURO',
                'home_route' => '/consult', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 4, 'org_id' => 2, 'real_name' => '张伟', 'username' => 'doctor_zhang',
                'password_hash' => $hash, 'phone' => '13800000004', 'email' => 'zhang@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'doctor', 'profession' => 'doctor',
                'member_id' => 'M-WY-004', 'department_id' => 'CARDIO',
                'home_route' => '/wards', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 5, 'org_id' => 2, 'real_name' => '陈静', 'username' => 'nurse_chen',
                'password_hash' => $hash, 'phone' => '13800000005', 'email' => 'chen@example.com',
                'identity_type' => 'NURSE', 'role_view' => 'doctor', 'profession' => 'nurse',
                'member_id' => 'M-WY-005', 'department_id' => 'EMERGENCY',
                'home_route' => '/reception', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 6, 'org_id' => 2, 'real_name' => '赵强', 'username' => 'dispatcher_zhao',
                'password_hash' => $hash, 'phone' => '13800000006', 'email' => 'zhao@example.com',
                'identity_type' => 'DISPATCHER', 'role_view' => 'director', 'profession' => '',
                'member_id' => 'M-WY-006', 'department_id' => 'EMERGENCY',
                'home_route' => '/command', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 7, 'org_id' => 3, 'real_name' => '李明', 'username' => 'doctor_li',
                'password_hash' => $hash, 'phone' => '13800000007', 'email' => 'liming@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'doctor', 'profession' => 'doctor',
                'member_id' => 'M-LJ-007', 'department_id' => 'EMERGENCY',
                'home_route' => '/dispatch', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 8, 'org_id' => 2, 'real_name' => '突击队一号', 'username' => 'ambulance_team',
                'password_hash' => $hash, 'phone' => '13800000008', 'email' => 'team@example.com',
                'identity_type' => 'AMBULANCE', 'role_view' => 'doctor', 'profession' => '',
                'member_id' => 'M-WY-008', 'department_id' => 'EMERGENCY',
                'home_route' => '/field', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 9, 'org_id' => 6, 'real_name' => '孙丽', 'username' => 'doctor_sun',
                'password_hash' => $hash, 'phone' => '13800000009', 'email' => 'sun@example.com',
                'identity_type' => 'DOCTOR', 'role_view' => 'doctor', 'profession' => 'doctor',
                'member_id' => 'M-NJ-009', 'department_id' => 'ICU',
                'home_route' => '/icu', 'user_status' => 'USER_ACTIVE',
                'last_login_at' => $now, 'last_login_ip' => '127.0.0.1',
                'is_deleted' => 0, 'deleted_at' => null, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
}
