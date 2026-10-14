<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consult_materials', function (Blueprint $table) {
            $table->id();
            $table->string('room_token', 64)->index('idx_material_room')->comment('会诊室 token');
            $table->string('session_id', 64)->default('')->index('idx_material_session')->comment('会诊会话编号');
            $table->string('patient_id', 64)->default('')->index('idx_material_patient')->comment('患者编号');
            $table->string('kind', 32)->default('')->index('idx_material_kind')->comment('资料类型：护理记录/检验记录/用药记录/评估记录/病程记录');
            $table->string('title', 128)->default('')->comment('资料标题');
            $table->text('content')->comment('资料内容');
            $table->string('source', 16)->default('local')->comment('来源：local本机演示/his/emr/lis');
            $table->string('author_id', 64)->default('')->comment('作者账号');
            $table->string('author_name', 64)->default('')->comment('作者姓名');
            $table->dateTime('shared_at')->useCurrent()->comment('共享时间');
            $table->dateTime('created_at')->useCurrent()->comment('创建时间');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consult_materials');
    }
};
