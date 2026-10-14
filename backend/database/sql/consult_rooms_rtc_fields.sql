-- ============================================================
-- 主系统对接远程会诊系统：consult_rooms 增加音视频会议字段
--
-- 执行库：主系统 MySQL（DB_DATABASE 指向的库）
-- 幂等：可重复执行，已存在的列与索引会跳过
-- 等价物：database/migrations/2026_10_14_000100_add_rtc_fields_to_consult_rooms_table.php
--        两者二选一，不要都执行
-- 上线顺序：
--   1) 执行本脚本（或 php artisan migrate）
--   2) 发版主系统后端代码
--   3) 配置 .env 的 CONSULT_RTC_* 变量并重启服务
--   4) 灰度发起一场会诊验证链路
-- ============================================================

-- ---------- 幂等辅助：列不存在才 ADD ----------
DROP PROCEDURE IF EXISTS hx_add_column_if_absent;
DELIMITER $$
CREATE PROCEDURE hx_add_column_if_absent(
    IN p_table  VARCHAR(64),   -- 表名
    IN p_column VARCHAR(64),   -- 列名
    IN p_define VARCHAR(512)   -- 完整列定义（含类型与 COMMENT）
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_define);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1. 会诊系统会议 ID（POST /api/rooms 返回的 sessionId），探活/抓参会人/结束会议都用它
CALL hx_add_column_if_absent('consult_rooms', 'rtc_session_id',
    'VARCHAR(32) NULL DEFAULT NULL COMMENT ''会诊系统会议ID'' AFTER rtc_url');

-- 2. TRTC 数字房间号，排障用
CALL hx_add_column_if_absent('consult_rooms', 'rtc_room_id',
    'INT NULL DEFAULT NULL COMMENT ''TRTC数字房间号'' AFTER rtc_session_id');

-- 3. 入会票据：供受邀专家拼加入链接
CALL hx_add_column_if_absent('consult_rooms', 'rtc_join_token',
    'VARCHAR(128) NULL DEFAULT NULL COMMENT ''会诊系统入会票据joinToken'' AFTER rtc_room_id');

-- 4. 房主凭证：结束会议、补签入会票据时透传
CALL hx_add_column_if_absent('consult_rooms', 'rtc_owner_token',
    'VARCHAR(128) NULL DEFAULT NULL COMMENT ''会诊系统房主凭证ownerToken'' AFTER rtc_join_token');

-- 5. 同步状态：0未同步 1成功 2失败待重试（补偿任务扫描 2 的记录重推）
CALL hx_add_column_if_absent('consult_rooms', 'rtc_sync_status',
    'TINYINT NOT NULL DEFAULT 0 COMMENT ''音视频同步状态:0未同步 1成功 2失败待重试'' AFTER rtc_owner_token');

-- 6. 最近一次同步时间
CALL hx_add_column_if_absent('consult_rooms', 'rtc_synced_at',
    'DATETIME NULL DEFAULT NULL COMMENT ''最近一次音视频同步时间'' AFTER rtc_sync_status');

-- ---------- 幂等辅助：索引不存在才 ADD ----------
DROP PROCEDURE IF EXISTS hx_add_index_if_absent;
DELIMITER $$
CREATE PROCEDURE hx_add_index_if_absent(
    IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_define VARCHAR(512)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND INDEX_NAME   = p_index
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', p_table, ' ADD INDEX ', p_index, ' ', p_define);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 7. 补偿扫描：按同步状态 + 会诊状态
CALL hx_add_index_if_absent('consult_rooms', 'idx_room_rtc_sync',
    '(`rtc_sync_status`, `status`)');

-- 8. 按会议 ID 反查会诊室
CALL hx_add_index_if_absent('consult_rooms', 'idx_room_rtc_session',
    '(`rtc_session_id`)');

DROP PROCEDURE IF EXISTS hx_add_column_if_absent;
DROP PROCEDURE IF EXISTS hx_add_index_if_absent;

-- ---------- 存量数据处理（无需执行，仅说明） ----------
-- 历史会诊单 media_mode 仍为 PLACEHOLDER、rtc_* 全空、rtc_sync_status=0，
-- 前端据此展示"音视频服务未就绪"，不影响既有会诊业务流程。

-- ============================================================
-- 回滚脚本（确认会诊系统已停止写入后再执行）
--
-- ALTER TABLE consult_rooms
--   DROP INDEX idx_room_rtc_sync,
--   DROP INDEX idx_room_rtc_session,
--   DROP COLUMN rtc_synced_at,
--   DROP COLUMN rtc_sync_status,
--   DROP COLUMN rtc_owner_token,
--   DROP COLUMN rtc_join_token,
--   DROP COLUMN rtc_room_id,
--   DROP COLUMN rtc_session_id;
-- ============================================================
