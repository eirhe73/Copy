# Mock API 契约（会议九项 · 联调占位）

Base URL 开发环境：`http://localhost:5173`  
生产：由网关统一前缀，例如 `https://{host}/api/v1/...`

所有 Mock 文件位于 `public/api/`，可直接复制为 OpenAPI 草案。

---

## GET `/api/dispatch-live.json`

进行中急救事件（实时出警页）。

**页面：** `dispatch.html#live`

---

## GET `/api/dispatch-ambulances.json`

救护车绑定与状态列表。

**页面：** `dispatch.html#ambulances`

---

## GET `/api/vehicles-gps.json`

120 车辆位置与 ETA（轮询 5–10s，生产建议 WebSocket）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `updatedAt` | ISO8601 | 服务端时间 |
| `vehicles[].id` | string | 车辆/任务 ID |
| `vehicles[].plate` | string | 车牌 |
| `vehicles[].status` | string | 出警中 / 站内待命 |
| `vehicles[].lng`, `lat` | number | WGS84 |
| `vehicles[].etaMinutes` | number \| null | 预计到达分钟 |
| `vehicles[].route` | `[lng,lat][]` | 可选，用于轨迹插值 |

**页面：** `dispatch.html#live`（嵌入车辆监控）· `meeting-portal.html#gps`

---

## GET `/api/beds-by-dept.json`

科室床位汇总（轮询或 ADT WebSocket 推送）。

| 字段 | 说明 |
|------|------|
| `departments[].id` | 科室 ID |
| `total`, `occupied`, `reserved`, `free` | 床位数 |

**页面：** `meeting-portal.html#beds` · 原系统 `/#/critical`

---

## GET `/api/device-bindings.json`

床旁设备与床位绑定。

| 字段 | 说明 |
|------|------|
| `devices[].deviceId` | 资产编号 |
| `devices[].bedId` | 当前床位，null 未绑 |
| `beds[]` | 可选床位列表 |

**写操作（生产）：** `PUT /devices/{id}/binding` body `{ bedId }`  
**演示：** 仅 localStorage

---

## GET `/api/qc-standards.json`

质控标准版本与合规率。

| 字段 | 说明 |
|------|------|
| `version` | 如 `2026-Q4` |
| `standards[].complianceRate` | 0–1 |
| `recentEvents[]` | 抽检记录 |

**页面：** `meeting-portal.html#qc` · `/#/medical-quality`

---

## GET `/api/consultation-admission.json`

入院远程会诊会话（独立运行 / 120 兼容）。

| 字段 | 说明 |
|------|------|
| `sessionId` | 会话 ID |
| `compatible120` | 是否带 120 任务号 |
| `patient.task120Id` | 120 任务号 |
| `participants[]` | 角色、在线状态 |

**生产：** WebRTC 信令 + `POST /consultations/{id}/notes`

**页面：** `meeting-portal.html#consult`

---

## GET `/api/gis-collab.json`

GIS 协作节点与连线（已有，15s 轮询）。

**页面：** `gis-command.html`

---

## 布局偏好（客户端）

| Key | 说明 |
|-----|------|
| `huaxi-meeting-layout-v1` | 会议页动态面板演示 |
| `huaxi-gis-ui-v1` | GIS 列表 / 图例 / 急诊数卡片 |
| `huaxi-er-draft-*` | 医生快速登记草稿 |

无需服务端；若需账号级同步可 POST `/users/{id}/preferences`。
