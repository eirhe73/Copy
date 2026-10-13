# 会议事项 · 技术评估与实施计划

> 基于当前仓库 `huaxi-command-center`（线上 React 打包 + 本地 `scenario.json` 演示 + 独立 GIS 页 `gis-command.html`）。  
> 评估日期：2026-10-12

## 总体现状

| 能力 | 线上/演示已有 | 缺口 |
|------|----------------|------|
| 指挥首页 / 调度 / 预警 / 重症 / 质控 | `/#/` 完整 UI（`public/assets/index-*.js`） | 源码未完全拆出，改深逻辑需逐步源码化或 API 层 |
| 车辆与轨迹 | `scenario.json` → `vehicles[].position`、`route` | 无真实 GPS 接入、无标准 ETA 服务 |
| 远程会诊 | 路由 `/consultations`、`/consultation/:token` 等 | 与真实 120/HIS 对接、离线独立运行未验证 |
| 床位监控 | `/#/critical`、`/#/beds` | 科室级实时数据需后端推送 |
| 设备-床位绑定 | 演示 localStorage `huaxi-demo-device-bindings` | 无统一设备台账与实时状态 |
| 质控标准 | `/medical-quality` 台账与报表 | 规则引擎、环节 SLA 需业务定义 |
| GIS 协同地图 | `gis-command.html`（Vue3+ECharts） | 与主站整合、真实节点 API |
| 动态调控面板 | GIS 页侧栏可收起 | 主站全局布局调控未做 |

---

## 分项计划

### 1. 动态调控面板（隐藏 / 调整位置）

**评估**：纯前端可行；需统一「布局偏好」模型（localStorage 或用户配置 API）。

**建议方案**：
- 定义面板 ID：`left-nav`、`map-collab`、`kpi-rail` 等。
- 状态：`visible` | `collapsed` | `docked:left|right|bottom` + `width/height`。
- GIS 页已实现「协作节点」收起；推广到主站需 **React 布局层**（或 iframe 嵌入 GIS 时 postMessage）。

**阶段**：  
- P0（1–2 周）：GIS 页 + 文档化协议；主站首页仅加「打开 GIS 大屏」与布局记忆。  
- P1（3–4 周）：主站 `AppShell` 可配置侧栏（需源码化或轻量 wrapper）。

**依赖**：产品确认默认布局与权限（是否院级统一配置）。

---

### 2. 120 急救车辆 GPS + 预计到达（2 个月 · 技术开发部）

**评估**：演示数据已有 `vehicles` 轨迹；生产需 **GPS 接入 + 地图引擎 + ETA 算法**。

**架构建议**：
```
GPS 终端/平台 → 接入网关 → 车辆位置流 (WebSocket/MQTT)
                         → 历史轨迹 API
前端 /#/dispatch + GIS 页 scatter/moving marker
ETA：路网 API（高德/百度）或简版直线+经验系数
```

**阶段**：
- W1–2：接口契约 `{ vehicleId, lng, lat, speed, heading, updatedAt }`；Mock + 前端地图联调。
- W3–6：对接 1 家 GPS 厂商测试环境；调度页实时刷新（≤5s）。
- W7–8：ETA 服务、异常离线、与现有 `scenario vehicles` 字段对齐。

**测试**：模拟 10 车并发、断线重连、时间回拨。

---

### 3. 入院远程会诊（4 个月 · 医疗系统开发组）

**评估**：前端会诊流程已有；**与 120 兼容且可独立运行** = 会诊服务 + 信令/媒体 + 账号体系双模式。

**建议**：
- **独立运行**：会诊微服务 + 最小患者上下文（院前录入包），不依赖 HIS 在线。
- **与 120 兼容**：统一患者 ID 映射、任务单号、HL7/FHIR 或院内中间表（待院方定）。

**阶段**：需求冻结 → 接口设计 → POC（WebRTC/第三方 RTC）→ 与 `/#/consultations` 联调 → 120 联调 → 验收。

**风险**：音视频合规、弱网、证书与备案。

---

### 4. 重症床位监控 · 科室实时（1 个月 · IT）

**评估**：`/#/critical` 为演示刷新；生产需 **床位状态事件源**（ADT/手工/物联网）。

**阶段**：
- W1：科室-床位-状态数据模型与 REST；WebSocket 推送增量。
- W2–3：前端订阅 + 大屏 `/critical` 与报表一致。
- W4：压测与 fallback 轮询。

---

### 5. 床旁设备与床位动态绑定（3 个月 · 医疗设备管理部）

**评估**：演示用 localStorage；生产需 **设备 UDI/资产号 ↔ 床位 ↔ 患者** 三元绑定与变更审计。

**阶段**：台账导入 → 绑定 API → 实时状态（在线/告警）→ 重症/床位 UI 展示。

---

### 6. 统一质控标准（持续 · 质控部门）

**评估**：现有质控台账 UI；缺 **可配置规则**（急救环节、预警响应、到床时间 SLA）。

**建议**：规则配置后台 + 事件埋点（从前端/后端统一上报）+ 报表对齐标准版本号。

---

### 7. 急救医生快速录入界面（2 个月 · UX）

**评估**：bundle 内已有语音解析占位（`AU` 字符串模板）；可加强 **少字段、大按钮、离线草稿**。

**阶段**：UX 走查 → 移动端/PC 双布局 → 与 `scenario` 保存逻辑或新 API 对接。

---

### 8. 新功能页面审核（持续 · 项目管理部）

**建议**：每迭代 checklist（浅色/深色、16:9、无多余动效、可访问性、演示数据标识）。

---

### 9. AI 介绍视频（2 周 · 视频团队）

**非本仓库范围**：脚本/分镜/提示词由团队产出；技术侧可提供 **页面录屏 + 功能清单** 供剪辑。

---

## 建议优先级（若资源有限）

1. **1 个月内**：床位监控数据管道（事项 4）+ GIS/面板调控协议（事项 1 P0）  
2. **2 个月内**：GPS Mock→实联（事项 2）+ 医生录入 UX（事项 7）  
3. **并行长周期**：会诊（3）、设备绑定（5）、质控规则（6）

---

## 演示前端已落地（2026-10-12 · 医生动线）

- **床 / 患者 / 设备互跳**：`care-link-enhance.js` 读 `care-bindings.json` 并合并 `scenario.json` 占用床；重症卡片可点进单床。
- **环节时限**：`qc-sla-enhance.js` 读 `qc-sla.json`，并用 scenario 预警 + `dispatch-live.json` 演示计算超时。
- **院前入口**：调度二级「实时出警 / 急救事件 / 患者登记」→ `dispatch.html` 对应 Tab；会诊 / 转诊 / 协同仍走主站。
- **基层调度链（H）**：`grassroots-demo-enhance.js` + `grassroots-demo.json`；转诊页高亮演示上转患者。
- **合规 / 浅色（L）**：`demo-compliance-enhance.js`、`meeting-room-enhance.js`；全站免责声明与质控/会诊表单浅色扫尾。
- **设备绑定（F）**：`device-bindings.json` 与 `care-bindings` 对齐；门户 `DeviceBinding.vue` + `/#/devices` 说明链。
- **会诊 / 布局 / 录屏（J/K/M）**：`ConsultAdmission.vue`、`LayoutControl.vue`、`VideoBrief.vue` 汇报可用。

## 本仓库可立即开工（无需等新硬件）

| 序号 | 可交付物 | 说明 |
|------|----------|------|
| A | `public/api/vehicles-gps.json` + 轮询/WebSocket Mock | 供调度/GIS 联调 GPS UI |
| B | GIS 页「布局偏好」持久化 | 侧栏/图例/急诊卡片显隐 |
| C | `docs/API-CONTRACTS.md` | 车辆、节点、床位、会诊最小接口 |
| D | 主站入口链到 `gis-command.html` | 统一协同地图入口 |
| E | 会诊/调度/重症 **演示验收清单** | `docs/DEMO-ACCEPTANCE.md` |

---

## 需要院方/产品确认的问题

1. GPS 厂商与坐标系（WGS84/ GCJ-02）  
2. 会诊是否必须国产化 RTC  
3. 床位权威数据源（HIS ADT vs 护士站手工）  
4. 质控指标口径与采样周期  
5. 主站最终是否 **全面浅色** 还是「指挥大屏深色 + 业务页浅色」
