#!/usr/bin/env python3
"""给 consult_rooms 添加对接远程会诊系统所需的 rtc_* 字段（只做 DDL，不动任何数据）。

配置从 backend/.env 读取，不会把账号密码写进脚本。

用法：
    python add_rtc_fields.py                 # 添加字段（幂等，已存在则跳过）
    python add_rtc_fields.py --check         # 只检查当前状态，不做改动
    python add_rtc_fields.py --rollback      # 回滚：删除本脚本添加的字段与索引

说明：
    * 仅执行 ALTER TABLE ... ADD COLUMN / ADD INDEX，不执行任何 INSERT/UPDATE/DELETE；
    * 每一条 DDL 前都先查 information_schema，已存在则跳过，可重复执行；
    * 新增字段均可为空或带默认值，存量数据的 media_mode 仍为 PLACEHOLDER，
      历史会诊单照常使用，前端会展示"音视频服务未就绪"。
"""
import os
import sys

import pymysql
from pymysql.err import ProgrammingError

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
TABLE = "consult_rooms"

# (列名, 完整列定义, 放在哪个列之后)
COLUMNS = [
    ("rtc_session_id", "VARCHAR(32) NULL DEFAULT NULL COMMENT '会诊系统会议ID'", "rtc_url"),
    ("rtc_room_id", "INT NULL DEFAULT NULL COMMENT 'TRTC数字房间号'", "rtc_session_id"),
    ("rtc_join_token", "VARCHAR(128) NULL DEFAULT NULL COMMENT '会诊系统入会票据joinToken'", "rtc_room_id"),
    ("rtc_owner_token", "VARCHAR(128) NULL DEFAULT NULL COMMENT '会诊系统房主凭证ownerToken'", "rtc_join_token"),
    ("rtc_sync_status",
     "TINYINT NOT NULL DEFAULT 0 COMMENT '音视频同步状态:0未同步 1成功 2失败待重试'", "rtc_owner_token"),
    ("rtc_synced_at", "DATETIME NULL DEFAULT NULL COMMENT '最近一次音视频同步时间'", "rtc_sync_status"),
]

# (索引名, 定义)
INDEXES = [
    ("idx_room_rtc_sync", "(`rtc_sync_status`, `status`)"),
    ("idx_room_rtc_session", "(`rtc_session_id`)"),
]


def load_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            env[key.strip()] = val.strip().strip("\"'")
    return env


def connect(env):
    return pymysql.connect(
        host=env["DB_HOST"],
        port=int(env.get("DB_PORT", 3306)),
        user=env["DB_USERNAME"],
        password=env.get("DB_PASSWORD", ""),
        database=env["DB_DATABASE"],
        charset="utf8mb4",
        autocommit=True,
        connect_timeout=10,
    )


def existing_columns(cur, db):
    cur.execute(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
        (db, TABLE),
    )
    return {r[0] for r in cur.fetchall()}


def existing_indexes(cur, db):
    cur.execute(
        "SELECT INDEX_NAME FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
        (db, TABLE),
    )
    return {r[0] for r in cur.fetchall()}


def do_apply(env):
    db = env["DB_DATABASE"]
    with connect(env) as conn:
        with conn.cursor() as cur:
            cols = existing_columns(cur, db)
            idxs = existing_indexes(cur, db)
            changed = 0

            for name, define, after in COLUMNS:
                if name in cols:
                    print(f"  · 跳过 {name}（已存在）")
                    continue
                sql = f"ALTER TABLE `{TABLE}` ADD COLUMN `{name}` {define} AFTER `{after}`"
                cur.execute(sql)
                print(f"  ✅ 已添加列 {name}")
                changed += 1

            for name, define in INDEXES:
                if name in idxs:
                    print(f"  · 跳过索引 {name}（已存在）")
                    continue
                cur.execute(f"ALTER TABLE `{TABLE}` ADD INDEX `{name}` {define}")
                print(f"  ✅ 已添加索引 {name}")
                changed += 1

            cur.execute(f"SELECT COUNT(*) FROM `{TABLE}`")
            rows = cur.fetchone()[0]

    print(f"\n完成：本次改动 {changed} 项。表 {TABLE} 现有 {rows} 行数据（未修改）。")
    return changed


def do_check(env):
    db = env["DB_DATABASE"]
    with connect(env) as conn:
        with conn.cursor() as cur:
            cols = existing_columns(cur, db)
            idxs = existing_indexes(cur, db)
            cur.execute(f"SELECT COUNT(*) FROM `{TABLE}`")
            rows = cur.fetchone()[0]
    print(f"库: {db}  表: {TABLE}  数据行数: {rows}\n")
    print("rtc_* 字段：")
    for name, _, _ in COLUMNS:
        print(f"  {'✅' if name in cols else '❌'} {name}")
    print("索引：")
    for name, _ in INDEXES:
        print(f"  {'✅' if name in idxs else '❌'} {name}")
    return 0


def do_rollback(env):
    db = env["DB_DATABASE"]
    with connect(env) as conn:
        with conn.cursor() as cur:
            idxs = existing_indexes(cur, db)
            cols = existing_columns(cur, db)
            for name, _ in INDEXES:
                if name in idxs:
                    cur.execute(f"ALTER TABLE `{TABLE}` DROP INDEX `{name}`")
                    print(f"  ↩️ 已删除索引 {name}")
            for name, _, _ in COLUMNS:
                if name in cols:
                    cur.execute(f"ALTER TABLE `{TABLE}` DROP COLUMN `{name}`")
                    print(f"  ↩️ 已删除列 {name}")
    print("\n回滚完成（仅删除本脚本添加的字段与索引，数据未受影响）。")
    return 0


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--apply"
    env = load_env(ENV_PATH)
    print(f"目标库: {env['DB_HOST']}:{env.get('DB_PORT', 3306)}/{env['DB_DATABASE']}\n")
    try:
        if mode == "--check":
            do_check(env)
        elif mode == "--rollback":
            do_rollback(env)
        else:
            do_apply(env)
    except ProgrammingError as e:
        print(f"执行失败: {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
