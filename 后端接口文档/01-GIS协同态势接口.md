# 01 · GIS 协同态势接口

## 1. 页面/模块概述

| 项 | 内容 |
|----|------|
| 页面名称 | 县域医疗协同 GIS 指挥大屏（`gis-command.html`）、3D 态势演示（`smart-city.html`） |
| 核心功能 | 展示县域内「县级/乡镇/基层」三级医疗协作节点的分布、节点间转诊/协作连线、各节点实时急诊数/空床数/床位紧张状况，并叠加 120 在途车辆 GPS 点位 |
| 涉及实体 | 协同节点（collab_node）、协同连线（collab_link）、救护车实时位置（vehicle_location） |
| 数据源 | `public/api/gis-collab.json`、`public/api/vehicles-gps.json`、`public/maps/{region}.json`（静态地图边界） |

前端交互（[GisMap.vue](../huaxi-command-center/src/gis-command/components/GisMap.vue)、[App.vue](../huaxi-command-center/src/gis-command/App.vue)）：

- 进入页面加载协同数据；随后 **15s 轮询**刷新协同数据、**10s 轮询**刷新车辆 GPS。
- 顶部 Tab 切换区域：`weiyuan`（威远协作）、`dafang`（大方参考）。
- 点击节点联动选中、高亮关联连线、展示节点详情；威远区域县级节点可跳转「120 院前工作台」。
- `smart-city.html` 为 3D 版，共享同一份 `gis-collab.json` 数据。

---

## 2. 数据模型定义

### 2.1 协同节点表 `collab_nodes`

| 字段名（小驼峰） | 数据库字段（蛇形） | 类型 | 必填 | 示例 | 说明 |
|------------------|--------------------|------|------|------|------|
| id | id | String | 是 | `wy-01` | 节点业务编号（如 wy-01、df-01） |
| name | name | String | 是 | `威远县人民医院` | 节点名称 |
| tier | tier | Integer | 是 | `0` | 层级：0 一级/1 二级/2 基层 |
| lng | lng | Decimal | 是 | `104.668` | 经度 |
| lat | lat | Decimal | 是 | `29.527` | 纬度 |
| er | er | Integer | 是 | `8` | 当前急诊数 |
| bedsFree | beds_free | Integer | 是 | `14` | 空床数 |
| tight | tight | Boolean | 是 | `false` | 床位紧张标记 |
| region | region_key | String | 是 | `weiyuan` | 所属区域：weiyuan / dafang |

**MySQL 建表语句（DDL）：**

```sql
CREATE TABLE `collab_nodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `node_id` VARCHAR(32) NOT NULL COMMENT '节点业务编号，如 wy-01',
  `region_key` VARCHAR(16) NOT NULL DEFAULT 'weiyuan' COMMENT '所属区域：weiyuan/dafang',
  `name` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '节点名称',
  `tier` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '层级：0一级/1二级/2基层',
  `lng` DECIMAL(10,6) NOT NULL DEFAULT 0 COMMENT '经度',
  `lat` DECIMAL(10,6) NOT NULL DEFAULT 0 COMMENT '纬度',
  `er` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前急诊数',
  `beds_free` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '空床数',
  `tight` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '床位紧张：0否1是',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_node_id` (`node_id`),
  KEY `idx_region_tier` (`region_key`, `tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='县域医疗协同节点表';
```

索引说明：
- `uk_node_id`：保证节点编号唯一，支撑按 id 点选联动。
- `idx_region_tier`：按区域 + 层级查询整屏节点，避免全表扫描。

### 2.2 协同连线表 `collab_links`

| 字段名 | 数据库字段 | 类型 | 必填 | 示例 | 说明 |
|--------|-----------|------|------|------|------|
| from | from_node_id | String | 是 | `wy-03` | 起始节点编号 |
| to | to_node_id | String | 是 | `wy-01` | 目标节点编号 |
| flow | flow | Integer | 是 | `5` | 转诊/协作流量（决定连线粗细） |
| region | region_key | String | 是 | `weiyuan` | 所属区域 |

```sql
CREATE TABLE `collab_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `region_key` VARCHAR(16) NOT NULL DEFAULT 'weiyuan' COMMENT '所属区域',
  `from_node_id` VARCHAR(32) NOT NULL COMMENT '起始节点编号',
  `to_node_id` VARCHAR(32) NOT NULL COMMENT '目标节点编号',
  `flow` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '转诊/协作流量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_region_from` (`region_key`, `from_node_id`),
  KEY `idx_region_to` (`region_key`, `to_node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='县域医疗协同连线表';
```

> 区域今日急诊数 `erToday` 为统计值，由 [`emergency_events`] 表按区域聚合生成，不单独建表。

---

## 3. 接口清单

### 3.1 获取县域协同态势

| 项目 | 内容 |
|------|------|
| 接口名称 | 获取县域协同态势 |
| 请求方法 | GET |
| 请求路径 | `/api/v1/gis/collab` |
| 接口描述 | 返回指定区域的协作节点列表、节点间连线、今日急诊数；GIS 大屏与 3D 态势共用 |
| 前端调用时机 | 页面加载时调用一次，之后 15s 轮询刷新 |
| 前端渲染对应 | `gis-command.html` 左侧节点列表 + 地图；`smart-city.html` 3D 标记与连线 |

**Query 参数：**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| region | String | 否 | 区域标识，缺省返回全部区域 | weiyuan |

**请求示例：**

```http
GET /api/v1/gis/collab?region=weiyuan HTTP/1.1
Authorization: Bearer {token}
```

**响应结构：**

成功：`data` 为区域对象（`weiyuan`、`dafang` 键），每个区域含 `erToday`、`nodes[]`、`links[]`。

**响应示例（成功）：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "updatedAt": "2026-10-12T14:28:00+08:00",
    "weiyuan": {
      "erToday": 86,
      "nodes": [
        { "id": "wy-01", "name": "威远县人民医院", "tier": 0, "lng": 104.668, "lat": 29.527, "er": 8, "bedsFree": 14, "tight": false },
        { "id": "wy-02", "name": "连界镇卫生院", "tier": 1, "lng": 104.55, "lat": 29.65, "er": 3, "bedsFree": 6, "tight": true }
      ],
      "links": [
        { "from": "wy-02", "to": "wy-01", "flow": 7 }
      ]
    },
    "dafang": {
      "erToday": 152,
      "nodes": [
        { "id": "df-01", "name": "大方县城 · 上级协同接收", "tier": 0, "lng": 105.609, "lat": 27.144, "er": 12, "bedsFree": 18, "tight": true }
      ],
      "links": []
    }
  }
}
```

**错误码：**

| code | 含义 |
|------|------|
| 200 | 成功 |
| 401 | 未认证或 Token 失效 |
| 404 | region 参数不合法 |

---

### 3.2 获取在途车辆 GPS 与 ETA

| 项目 | 内容 |
|------|------|
| 接口名称 | 获取在途车辆 GPS 与 ETA |
| 请求方法 | GET |
| 请求路径 | `/api/v1/vehicles/gps` |
| 接口描述 | 返回在途救护车实时位置、速度、朝向、目的地、预计到达时间及轨迹路线 |
| 前端调用时机 | GIS 大屏 / 车辆监控 / 调度 GPS 页加载时调用，10s（GIS）/ 5s（监控）轮询 |
| 前端渲染对应 | GIS 地图 120 车辆点位；`dispatch.html` 车辆监控地图；`meeting-portal.html` GPS 页 |

**请求示例：**

```http
GET /api/v1/vehicles/gps HTTP/1.1
Authorization: Bearer {token}
```

**响应示例（成功）：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "updatedAt": "2026-10-12T14:28:00+08:00",
    "vehicles": [
      {
        "id": "AMB-1",
        "plate": "演示001",
        "status": "DISPATCHING",
        "lng": 104.656,
        "lat": 29.569,
        "speedKmh": 42,
        "heading": 135,
        "destination": "威远县人民医院",
        "etaMinutes": 8,
        "route": [[104.565, 29.717], [104.585, 29.702], [104.599, 29.666]]
      }
    ]
  }
}
```

**字段映射（前端 ↔ 后端）：**

| 前端展示 | 后端字段 | 类型 | 说明 |
|---------|---------|------|------|
| 车牌 | plate | String | 车辆牌照 |
| 状态 | status | String | 见全局枚举 3.1（DISPATCHING/ON_SCENE/RETURNING/STANDBY） |
| 经度/纬度 | lng / lat | Decimal | GPS 坐标 |
| 速度 | speedKmh | Integer | km/h |
| 朝向 | heading | Integer | 0-360 度 |
| 目的地 | destination | String | 目标医院 |
| 预计到院 | etaMinutes | Integer | 分钟，可空 |
| 轨迹 | route | Array<[lng,lat]> | 轨迹折线点集 |

**错误码：** 同 3.1（200 / 401）。

> 车辆台账表 `vehicles`、实时位置表 `vehicle_locations` 的 DDL 见 [02-院前急救调度接口](02-院前急救调度接口.md) §2.1。

---

## 4. 状态与枚举值

| 字段 | code（存储） | label（显示） | color |
|------|-------------|--------------|-------|
| node.tier | 0 / 1 / 2 | 一级·县级 / 二级·乡镇 / 基层 | 主题主色随层级减弱 |
| node.tight | true / false | 床位紧张（红） / 正常 | `#EF4444` |
| vehicle.status | DISPATCHING 等 | 见全局 3.1 | 出警/现场/返院/待命 |

---

## 5. 交互与边界说明

- **区域切换**：切换 `region` 时前端重新拉取并重绘地图（`GisMap` 会重新 `registerMap(region)`），后端按 `region_key` 过滤即可。
- **节点选中联动**：选中节点高亮其所有关联连线（`from` 或 `to` 命中该节点）。后端已按 `idx_region_from`/`idx_region_to` 建索引，无需额外接口，前端本地过滤。
- **坐标精度**：经纬度保留 6 位小数；`route` 为 `JSON` 数组存储。
- **性能**：`gis/collab` 与 `vehicles/gps` 均为高频轮询（10~15s），建议接口加轻量缓存（如 3~5s），并保证查询走索引。

---

## 6. 前端对接注意事项

- **生命周期**：`onMounted` 首次加载 → 启动轮询；`onUnmounted` 清理定时器。
- **loading 状态**：首次加载未返回前地图不渲染（`v-if="payload && !loadError"`），建议加骨架屏。
- **错误提示**：加载失败提示「协同数据加载失败」，车辆加载失败静默置空并下轮重试。
- **空数据**：无节点时左侧列表为空，地图仅显示边界；无车辆时不显示车辆图例与「院前 N 车」角标。