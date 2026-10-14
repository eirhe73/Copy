-- ============================================================
-- 定时会诊：consult_sessions 增加预定开始时间字段
--
-- 执行库：主系统 MySQL（DB_DATABASE 指向的库）
-- 幂等：可重复执行，已存在的列会跳过
-- 变更方式：按项目规则，表结构变更一律走 SQL 脚本（database/sql/），
--           禁止使用 Laravel migration 修改表结构
-- 上线顺序：
--   1) 执行本脚本
--   2) 发版主系统后端代码（模型/校验/服务已按 scheduled_at 字段适配）
--   3) 发起一场定时会诊验证：队列显示"定时 · 开始时间"，到点后出现"进入会诊室"
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

-- 1. 预定开始时间：为空表示立即开始（现有会诊单行为不变）
--    存储为 UTC（与应用时区一致），前端发送带时区的 ISO8601 并按浏览器时区展示
--    未到点时队列显示"定时 · 开始时间"，进入会诊室被禁止；
--    音视频房间延迟到点后首次入会时按需创建（会诊系统房间为内存态，提前创建会被回收）
CALL hx_add_column_if_absent('consult_sessions', 'scheduled_at',
    'DATETIME NULL DEFAULT NULL COMMENT ''预定开始时间：为空表示立即开始'' AFTER note');

DROP PROCEDURE IF EXISTS hx_add_column_if_absent;

-- ============================================================
-- 回滚脚本（需要时单独执行）：
--
-- ALTER TABLE consult_sessions DROP COLUMN scheduled_at;
-- ============================================================
