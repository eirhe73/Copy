<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 基层反馈表 dr_posts（§2.1）
        Schema::create('dr_posts', function (Blueprint $table) {
            $table->id();
            $table->string('post_id', 64)->comment('反馈/问题业务编号');
            $table->unsignedTinyInteger('category')->default(0)->comment('类型：0基层反馈1问题上报');
            $table->string('title', 128)->default('')->comment('标题');
            $table->text('content')->comment('内容');
            $table->string('institution_id', 64)->default('')->comment('上报机构编号');
            $table->string('institution_name', 64)->default('')->comment('上报机构名称');
            $table->string('department', 64)->default('')->comment('上报科室');
            $table->string('reporter_id', 64)->default('')->comment('上报人账号');
            $table->string('reporter_name', 64)->default('')->comment('上报人姓名');
            $table->string('contact', 64)->default('')->comment('联系方式');
            $table->unsignedTinyInteger('priority')->default(0)->comment('优先级：0普通1紧急');
            $table->unsignedTinyInteger('status')->default(0)->comment('状态：0待处理1已回复2已办结');
            $table->text('reply')->nullable()->comment('回复内容');
            $table->string('replied_by', 64)->default('')->comment('回复人');
            $table->dateTime('replied_at')->nullable()->comment('回复时间');
            $table->json('attachments')->nullable()->comment('附件地址列表');
            $table->timestamps();

            $table->unique('post_id', 'uk_post_id');
            $table->index(['category', 'status'], 'idx_category_status');
            $table->index('institution_id', 'idx_post_institution');
            $table->index('created_at', 'idx_created');
        });

        // 协作消息表 dr_messages（§2.2）
        Schema::create('dr_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id', 64)->comment('消息编号');
            $table->string('thread_id', 64)->default('')->comment('协作线程序列（收/发同链）');
            $table->string('institution_id', 64)->default('')->comment('发送机构编号');
            $table->string('institution_name', 64)->default('')->comment('发送机构名称');
            $table->string('sender_id', 64)->default('')->comment('发送人账号');
            $table->string('sender_name', 64)->default('')->comment('发送人姓名');
            $table->unsignedTinyInteger('kind')->default(0)->comment('消息类型：0文字1语音2图片3文件');
            $table->text('content')->nullable()->comment('文字消息正文');
            $table->string('media_url', 255)->default('')->comment('语音/图片/文件 URL');
            $table->unsignedInteger('duration_sec')->default(0)->comment('语音时长（秒）');
            $table->unsignedTinyInteger('is_read')->default(0)->comment('已读：0未读1已读');
            $table->dateTime('created_at')->useCurrent()->comment('发送时间');

            $table->unique('message_id', 'uk_message_id');
            $table->index('thread_id', 'idx_thread');
            $table->index('institution_id', 'idx_message_institution');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dr_messages');
        Schema::dropIfExists('dr_posts');
    }
};
