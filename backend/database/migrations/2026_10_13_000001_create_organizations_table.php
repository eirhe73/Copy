<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('org_code', 50)->unique()->comment('机构编码');
            $table->string('org_name', 200)->comment('机构名称');
            $table->string('org_type', 50)->index()->comment('机构类型：县医院/乡镇卫生院/急救中心');
            $table->string('county_name', 100)->nullable()->comment('所属县区');
            $table->string('address', 500)->nullable();
            $table->decimal('lng', 10, 6)->nullable()->comment('经度 WGS84');
            $table->decimal('lat', 10, 6)->nullable()->comment('纬度 WGS84');
            $table->string('contact_phone', 50)->nullable();
            $table->string('short_name', 100)->default('')->comment('机构简称');
            $table->string('level', 20)->default('')->index()->comment('层级：center/city/county/township/village');
            $table->string('province', 50)->default('');
            $table->string('city', 50)->default('');
            $table->string('town', 50)->nullable();
            $table->boolean('verified')->default(false)->comment('信息已核对');
            $table->boolean('current_operation_verified')->default(true)->comment('运行状态已核对');
            $table->string('verification_scope', 500)->default('')->comment('核验范围说明');
            $table->unsignedTinyInteger('tier')->default(0)->comment('协同层级：0中心1市级2县级3乡镇4村级');
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
