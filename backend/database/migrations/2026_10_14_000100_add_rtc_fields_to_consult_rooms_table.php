<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 对接远程会诊系统：consult_rooms 增加音视频会议字段
 *
 * rtc_session_id  会诊系统的会议 ID，后续探活/抓参会人/结束会议都用它
 * rtc_room_id     TRTC 数字房间号，排障用
 * rtc_join_token  入会票据，供受邀专家拼加入链接
 * rtc_owner_token 房主凭证，结束会议时透传给 DELETE /api/rooms/{id}
 * rtc_sync_status 同步状态：0未同步 1成功 2失败待重试
 * rtc_synced_at   最近一次同步时间
 *
 * 存量数据默认 rtc_sync_status=0 且 media_mode 仍为 PLACEHOLDER，不影响历史会诊单。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consult_rooms', function (Blueprint $table) {
            if (! Schema::hasColumn('consult_rooms', 'rtc_session_id')) {
                $table->string('rtc_session_id', 32)->nullable()->comment('会诊系统会议ID')->after('rtc_url');
            }
            if (! Schema::hasColumn('consult_rooms', 'rtc_room_id')) {
                $table->integer('rtc_room_id')->nullable()->comment('TRTC数字房间号')->after('rtc_session_id');
            }
            if (! Schema::hasColumn('consult_rooms', 'rtc_join_token')) {
                $table->string('rtc_join_token', 128)->nullable()->comment('会诊系统入会票据joinToken')->after('rtc_room_id');
            }
            if (! Schema::hasColumn('consult_rooms', 'rtc_owner_token')) {
                $table->string('rtc_owner_token', 128)->nullable()->comment('会诊系统房主凭证ownerToken')->after('rtc_join_token');
            }
            if (! Schema::hasColumn('consult_rooms', 'rtc_sync_status')) {
                $table->tinyInteger('rtc_sync_status')->default(0)->comment('音视频同步状态:0未同步 1成功 2失败待重试')->after('rtc_owner_token');
            }
            if (! Schema::hasColumn('consult_rooms', 'rtc_synced_at')) {
                $table->dateTime('rtc_synced_at')->nullable()->comment('最近一次音视频同步时间')->after('rtc_sync_status');
            }
        });

        // MySQL 下单独建索引（SQLite 单元测试环境跳过，避免 hasIndex 差异）
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('consult_rooms', function (Blueprint $table) {
                if (! $this->hasIndex('consult_rooms', 'idx_room_rtc_sync')) {
                    $table->index(['rtc_sync_status', 'status'], 'idx_room_rtc_sync');
                }
                if (! $this->hasIndex('consult_rooms', 'idx_room_rtc_session')) {
                    $table->index(['rtc_session_id'], 'idx_room_rtc_session');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('consult_rooms', function (Blueprint $table) {
            $drop = [];
            foreach (['rtc_synced_at', 'rtc_sync_status', 'rtc_owner_token', 'rtc_join_token', 'rtc_room_id', 'rtc_session_id'] as $col) {
                if (Schema::hasColumn('consult_rooms', $col)) {
                    $drop[] = $col;
                }
            }
            if ($drop) {
                $table->dropColumn($drop);
            }
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('consult_rooms', function (Blueprint $table) {
                if ($this->hasIndex('consult_rooms', 'idx_room_rtc_sync')) {
                    $table->dropIndex('idx_room_rtc_sync');
                }
                if ($this->hasIndex('consult_rooms', 'idx_room_rtc_session')) {
                    $table->dropIndex('idx_room_rtc_session');
                }
            });
        }
    }

    private function hasIndex(string $table, string $index): bool
    {
        $rows = Schema::getConnection()
            ->select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]);

        return ! empty($rows);
    }
};
