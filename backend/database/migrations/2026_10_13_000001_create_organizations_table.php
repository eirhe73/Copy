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
