# 3D 医院地图（digital-twin-map）

## 入口

- 开发：`npm run dev` → [http://localhost:5173/digital-twin-map.html](http://localhost:5173/digital-twin-map.html)
- 构建：`npm run build` 后访问 `/digital-twin-map.html`

## 组件结构

```
digital-twin-map.html
  └── src/digital-twin/main.tsx
        └── App.tsx
              ├── HospitalMap3D.tsx   # Three.js 县界 + 医院楼块 + 点击射线
              └── HospitalInfoPanel.tsx  # 右侧信息 / 全县概览 / 列表联动
```

数据：`public/hospitals-3d.json` + `public/maps/weiyuan.json`（或 `dafang.json`）。

## 新增一家医院

编辑 `public/hospitals-3d.json`，在 `hospitals` 数组增加一条：

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 地图内唯一键 |
| `institutionId` | 是 | 与后端 / 指挥台路由一致 |
| `name` | 是 | 全称（面板标题） |
| `shortName` | 是 | 地图顶牌短名 |
| `lng`, `lat` | 是 | 与 GeoJSON 同坐标系 |
| `tier` | 是 | `0` 县级 · `1` 乡镇 · `2` 村室 · `3` 协作上级（影响楼高与颜色） |
| `level`, `address`, `emergencyPhone` | 否 | 面板展示 |
| `beds`, `stats`, `departments`, `status` | 否 | 演示指标 |

同时可把 `summary.hospitalCount` 等汇总数字改一致。

## 后端（可选）

登录且桥接开启时，选中医院会尝试 `GET /organizations/{institutionId}` 补充机构编码；**无定时轮询**。

## 交互

- 点击 3D 楼块 → 右侧详情；点击空白或 **Esc** → 全县概览
- 右侧列表 → 选中并 **flyTo** 该点
- 未选中其他机构时，非选中楼块半透明
