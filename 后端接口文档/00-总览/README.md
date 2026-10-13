# 华西·县域急危重症救治一体化指挥中心 — 后端接口文档

> 版本：v1.1（PHP + MySQL 版）
> 生成方式：前端驱动反向推导（依据 `huaxi-command-center` 前端组件 + `public/api/*.json` Mock 数据结构）
> 编制日期：2026-10-13

---

## 1. 项目概述

本系统为「县域急危重症救治一体化指挥中心」，覆盖院前急救调度、县域医疗协同、远程会诊、床位/设备、质控预警等业务。当前前端为本地 MVP 演示工程，后端（`backend/` Laravel 10 脚手架）尚为空壳，本批接口文档用于指导后端从零实现。

### 1.1 前端多页面架构与数据源对应关系

| 前端入口 | 技术栈 | 承载业务 | 依赖 Mock 数据 |
|---------|--------|---------|----------------|
| `index.html`（主 SPA，`/#/`） | React + HashRouter | 指挥中枢、登录、26 个占位路由 | 占位页无真实数据 |
| `gis-command.html` | Vue | 县域医疗协同 GIS 大屏 | `gis-collab.json`、`vehicles-gps.json` |
| `smart-city.html` | React + Three.js | 3D 县域态势演示 | `maps/weiyuan.json`、`gis-collab.json` |
| `dispatch.html` | Vue | 120 院前急救调度 | `dispatch-live.json`、`dispatch-ambulances.json`、`vehicles-gps.json` |
| `meeting-portal.html` | Vue | 会诊门户九项交付 | `beds-by-dept.json`、`device-bindings.json`、`consultation-admission.json`、`qc-standards.json`、`qc-sla.json` |

> 说明：主 React 应用的 `/` 首页及 25 个路由均为 `PageScaffold` 占位脚手架（见 [PageScaffold.tsx](../huaxi-command-center/src/components/PageScaffold.tsx)），`/login` 为演示级登录（任意输入即可进入）。故**不针对占位页臆造接口**，本文档仅推导有真实数据/交互的接口。

### 1.2 业务实体总览

| 实体 | 英文/表名 | 所属模块 | 说明 |
|------|-----------|---------|------|
| 救护车 | `vehicles` | 院前调度 | 车辆、班组、绑定医院、当前事件 |
| 急救事件 | `emergency_events` | 院前调度 | 一次出车一条事件 |
| 急救患者登记 | `emergency_patients` | 院前调度 | 车上就地登记患者 |
| 协同节点 | `collab_nodes` | GIS 协同 | 县级/乡镇/基层三级协作节点 |
| 协同连线 | `collab_links` | GIS 协同 | 节点间转诊/协作连线 |
| 科室床位统计 | `department_beds` | 会诊门户 | 科室总床/占用/预留/空床 |
| 医疗设备 | `medical_devices` | 会诊门户 | 床旁监护设备台账 |
| 会诊会话 | `consult_sessions` | 会诊门户 | 入院远程会诊 |
| 会诊成员 | `consult_participants` | 会诊门户 | 会话参与人 |
| 质控标准 | `qc_standards` | 质控 | 标准项与合规率 |
| 质控抽检记录 | `qc_check_records` | 质控 | 近期抽检达标记录 |
| SLA 规则 | `sla_rules` | 质控 | 时效规则 |
| SLA 记录 | `sla_records` | 质控 | 时效执行记录 |
| 预警摘要 | `warning_summaries` | 预警 | 24h 预警汇总 |
| 预警趋势 | `warning_trends` | 预警 | 趋势预测条目 |
| 预警闭环 | `warning_closed_loop` | 预警 | 处置闭环各阶段计数 |
| 床-患-设备绑定 | `care_bindings` | 绑定 | 床/患者/设备/摄像头四元绑定 |

---

## 2. 技术栈与全局约定

### 2.1 技术栈

- **后端框架**：Laravel 10（PHP 8.1+）
- **数据库**：MySQL 8.x，字符集 `utf8mb4`，排序规则 `utf8mb4_unicode_ci`
- **接口风格**：RESTful，返回标准 JSON
- **认证**：Laravel Sanctum（Token），见 §2.6

### 2.2 统一响应结构

所有接口响应统一包裹为：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code = 200` 表示成功；非 200 表示业务异常。
- PHP 输出使用 `json_encode($response, JSON_UNESCAPED_UNICODE)`，确保中文不被转义。

### 2.3 分页规范

涉及列表查询，分页参数统一：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 是 | 当前页码，从 1 开始 |
| pageSize | Integer | 是 | 每页条数，默认 10，最大 100 |

响应中数据部分统一携带 `total`（总条数）与 `list`（数据数组）。

> 当前演示前端所有列表均为一次全量加载 + 本地轮询，无真实分页 UI；下述列表接口按规范预留分页参数，`pageNum`/`pageSize` 为可选兼容项。

### 2.4 时间字段规范

- **数据库存储**：统一 `DATETIME` 类型，格式 `YYYY-MM-DD HH:MM:SS`。
- **接口返回**：统一 ISO 8601 字符串，如 `2026-10-12T14:08:00+08:00`。
- **表标准字段**：`created_at`、`updated_at`；需软删除的表增加 `deleted_at`。

### 2.5 命名规范与字段映射

- 数据库表名：蛇形（`emergency_events`）；字段：蛇形（`patient_name`）。
- PHP 类名：大驼峰（`EmergencyEventController`）。
- API 字段：小驼峰（`patientName`）。
- 文档中以「前端展示名 ↔ 后端字段名」显式标注映射。

### 2.6 认证与权限

前端登录页当前为演示级（任意账号密码进入）。正式实现建议：

- `POST /api/v1/auth/login`：账号 + 密码 → 返回 `token`（Sanctum）。
- 除健康检查与登录外，其余接口需 `Authorization: Bearer {token}`。
- 权限维度预留：`roleView`（`doctor` / `director`），用于质控/SLA 数据集权限；具体见质控模块。

---

## 3. 全局枚举字典

### 3.1 车辆/事件状态（`status`）

| 后端存储值 | 显示文本 | 场景 | 说明 |
|-----------|---------|------|------|
| `DISPATCHING` | 出警中 | 车辆/事件 | 已接警赶往现场 |
| `ON_SCENE` | 现场处置 | 车辆/事件 | 到达现场处置 |
| `RETURNING` | 返院途中 | 车辆/事件 | 送医途中 |
| `STANDBY` | 待命 | 车辆 | 空闲待命 |

> 现有 Mock 使用中文文本（"出警中"等），后端建议落库为上述英文枚举 + TINYINT 存储（见各表 DDL），接口返回英文码，前端做映射。

### 3.2 事件等级（`level`）

| 存储值 | 显示文本 |
|--------|---------|
| `CRITICAL` | 重症 |
| `ACUTE` | 急症 |
| `GENERAL` | 一般 |

### 3.3 协同层级（`tier`）

| 存储值 | 显示文本 | 说明 |
|--------|---------|------|
| `0` | 一级 · 县级 | 县域牵头 / 上级接收转诊 |
| `1` | 二级 · 乡镇 | 乡镇协作，可向上发起会诊 |
| `2` | 基层 | 基层网点，采集与转运起点 |

### 3.4 性别（`gender`）

| 存储值 | 显示文本 |
|--------|---------|
| `MALE` | 男 |
| `FEMALE` | 女 |

### 3.5 会诊会话状态（`status`）

| 存储值 | 显示文本 |
|--------|---------|
| `WAITING` | 待接诊 |
| `IN_CALL` | 会诊中 |
| `FINISHED` | 已结束 |

### 3.6 绑定范围（`scope`）

| 存储值 | 显示文本 |
|--------|---------|
| `LOCAL` | 本院 |
| `PARTNER` | 协作医院 |
| `LOWER` | 下级医院 |

### 3.7 床位紧张标记（`tight`）

Boolean：`true` = 床位紧张，`false` = 正常。

---

## 4. 文档目录（按业务域文件夹分类）

```
后端接口文档/
├── 00-总览/
│   ├── README.md                  ← 本文件（概览 + 通用规范 + 目录索引）
│   └── 接口清单总表.md             ← 121 个接口全量清单（★=已详述）
├── 01-指挥大屏/                    （25 接口）
│   ├── 00-GIS协同态势接口.md
│   ├── 01-指挥大屏总览接口.md
│   ├── 02-院前急救调度接口.md
│   └── 03-转运与视频监控接口.md
├── 02-预警与重症/                  （13 接口）
│   ├── 01-预警中心接口.md
│   └── 02-重症监护接口.md
├── 03-患者与床位/                  （24 接口）
│   ├── 01-床位管理接口.md
│   ├── 02-患者管理接口.md
│   └── 03-转诊协同接口.md
├── 04-会诊协同/                    （15 接口）
│   ├── 01-会诊协同接口.md
│   ├── 02-床患设备绑定接口.md
│   └── 03-基层医声接口.md
├── 05-质控管理/                    （12 接口）
│   └── 01-质控管理接口.md
├── 06-机构与配置/                  （17 接口）
│   ├── 01-机构管理接口.md
│   ├── 02-救治中心接口.md
│   ├── 03-设备管理接口.md
│   └── 04-消息中心接口.md
├── 07-移动端与会诊/                （6 接口）
│   └── 01-移动端与会诊接口.md
├── 08-系统/                        （9 接口）
│   ├── 01-认证接口.md
│   └── 02-系统设置接口.md
├── 09-三大模块(基层调度、医院质控、基层医生Dr)专项/  （联调索引，无新增接口）
│   ├── 01-三大模块接口汇总.md       ← 基层调度/医院质控/基层医生Dr 汇总 + 待确认清单
│   └── 02-华西·县域急危重症救治一体化指挥中心 接口文档 三大模块接口文档-模板V1.0.md ← 三大模块 37 接口按《接口文档1.0.md》模板的结构化改写版
└── 10-急救调度与监控专项/            （产品 IA 双板块，无新增接口）
    ├── 01-急救调度板块接口.md       ← 1.1～1.5 急救事件/实时出警/远程会诊/患者登记/车辆监控
    └── 02-急救监控板块接口.md       ← 2.1～2.7 预警通知/科室与床位/设备/五大中心/基层重症
```

> 每个业务域文件夹下按「子模块」拆分 md，避免单文件接口过多；接口清单与「已详述(★)」状态统一见 [接口清单总表.md](接口清单总表.md)。

---

## 5. MySQL 建表通用约定

所有表（见各模块文档 DDL）统一遵循：

- 引擎 `InnoDB`，字符集 `utf8mb4`，排序规则 `utf8mb4_unicode_ci`。
- 主键 `id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT`。
- 业务编号类字段（`*_no`、`*_id` 字符串型）加唯一索引 `uk_*`。
- 高频查询字段加普通/联合索引 `idx_*`。
- 时间戳字段 `created_at` / `updated_at` 默认 `CURRENT_TIMESTAMP`。
- 软删除表增加 `deleted_at DATETIME NULL DEFAULT NULL`。