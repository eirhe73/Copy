<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('short_name', 100)->default('')->comment('机构简称');
            $table->string('level', 20)->default('')->index()->comment('层级：center/city/county/township/village');
            $table->string('province', 50)->default('');
            $table->string('city', 50)->default('');
            $table->string('town', 50)->nullable();
            $table->boolean('verified')->default(false)->comment('信息已核对');
            $table->boolean('current_operation_verified')->default(true)->comment('运行状态已核对');
            $table->string('verification_scope', 500)->default('')->comment('核验范围说明');
            $table->unsignedTinyInteger('tier')->default(0)->comment('协同层级：0中心1市级2县级3乡镇4村级');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['short_name', 'level', 'province', 'city', 'town', 'verified', 'current_operation_verified', 'verification_scope', 'tier']);
        });
    }
};
