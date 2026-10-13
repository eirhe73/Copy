<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dr_posts', function (Blueprint $table) {
            $table->id();
            $table->string('post_id', 64)->unique()->comment('反馈/问题业务编号');
            $table->string('category', 16)->default('FEEDBACK')->comment('类型：FEEDBACK基层反馈 ISSUE问题上报');
            $table->string('title', 128)->default('');
            $table->text('content');
            $table->string('institution_id', 64)->default('')->comment('上报机构编号');
            $table->string('institution_name', 64)->default('')->comment('上报机构名称');
            $table->string('department', 64)->default('')->comment('上报科室');
            $table->string('reporter_id', 64)->default('')->comment('上报人账号');
            $table->string('reporter_name', 64)->default('')->comment('上报人姓名');
            $table->string('contact', 64)->default('')->comment('联系方式');
            $table->unsignedTinyInteger('priority')->default(0)->comment('优先级：0普通 1紧急');
            $table->string('status', 16)->default('PENDING')->comment('状态：PENDING待处理 REPLIED已回复 RESOLVED已办结');
            $table->text('reply')->nullable()->comment('回复内容');
            $table->string('replied_by', 64)->default('')->comment('回复人');
            $table->dateTime('replied_at')->nullable()->comment('回复时间');
            $table->json('attachments')->nullable()->comment('附件地址列表');
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index('institution_id');
            $table->index('created_at');
        });

        Schema::create('dr_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id', 64)->unique()->comment('消息编号');
            $table->string('thread_id', 64)->default('')->comment('协作线程序列（收/发同链）');
            $table->string('institution_id', 64)->default('')->comment('发送机构编号');
            $table->string('institution_name', 64)->default('')->comment('发送机构名称');
            $table->string('sender_id', 64)->default('')->comment('发送人账号');
            $table->string('sender_name', 64)->default('')->comment('发送人姓名');
            $table->string('kind', 16)->default('TEXT')->comment('消息类型：TEXT文字 VOICE语音 IMAGE图片 FILE文件');
            $table->text('content')->nullable()->comment('文字消息正文');
            $table->string('media_url', 255)->default('')->comment('语音/图片/文件 URL');
            $table->unsignedInteger('duration_sec')->default(0)->comment('语音时长（秒）');
            $table->boolean('is_read')->default(false)->comment('已读：0未读 1已读');
            $table->timestamps();

            $table->index('thread_id');
            $table->index('institution_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dr_messages');
        Schema::dropIfExists('dr_posts');
    }
};
