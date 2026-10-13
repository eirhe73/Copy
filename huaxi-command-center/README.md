# 华西 · 县域急危重症救治一体化指挥中心（本地复刻）

## 重要说明

之前 `src/` 里带**左侧开发导航**的版本只是路由骨架，**外观与线上不一致**。

本地默认加载 **`theme-light.css`** + **`map-presentation.css`** + **`map-medical-overlay.js`**：全站**浅色调**；首页 3D 地图为**浅色地形 + 协作节点医疗卡片**（在诊急诊 / 空余床位 / 是否可转诊）。地图材质：`npm run patch:map`（`restore:original` 后需再执行）。

若只想看与线上一模一样的深蓝大屏：在 `index.html` 里删掉上述两个 `link`，并把 `theme-color` 改回 `#071a3b`。

若 JS/CSS 被改乱：`npm run restore:original`，然后 **Ctrl+F5** 强刷（不会删除 `theme-light.css`，只会覆盖 `index-*.js/css`）。

## 快速开始

```bash
cd huaxi-command-center
npm install
npm run dev
```

浏览器访问终端里的地址，例如：**http://localhost:5173/#/**（必须使用 Hash 路由 `#/`）。

### 开发：点击页面跳转源码（code-inspector）

仅在 `npm run dev` 下生效（生产构建不会注入）。

1. 启动：`npm run dev`
2. 打开带 **Vue 源码** 的页面，例如 `dispatch.html`、`gis-command.html`、`meeting-portal.html`、`smart-city.html`
3. 按住 **Alt + Shift**（Mac 为 **Option + Shift**），**单击**界面上的按钮、表单等区域
4. 会在 **Cursor / VS Code** 中打开对应 `.vue` / `.tsx` 文件及行号（需用 Cursor 打开本项目根目录）

说明：指挥中枢首页 `index.html` 加载的是打包好的 `public/assets/index-*.js`，**无法**精确跳到 React 组件源码；可点击跳转的包括 `src/dispatch-hub/`、`src/gis-command/`、`src/meeting/`、`src/smart-city/` 以及 Vite 直接提供的页面。`public/assets/*-enhance.js` 需在编辑器里按文件名自行打开。

可选环境变量：`CODE_INSPECTOR_EDITOR=cursor`（默认会自动探测 Cursor / VS Code）。

### 大方县医疗协同 GIS 指挥大屏（Vue3 + ECharts）

按 16:9 **浅色** GIS 规范独立页面（2D 圆环 + 协作连线，无 3D 柱）：

**http://localhost:5173/gis-command.html**

- 地图：`/maps/dafang.json` / `weiyuan.json`，2D 圆环散点
- 数据：`/api/gis-collab.json`（可换真实接口，见 `src/gis-command/api.ts`）
- 页头可隐藏列表 / 图例 / 急诊数卡片（写入 `localStorage`）

### 120 急救调度 · 四页工作台（会议 IA）

**http://localhost:5173/dispatch.html**

- `#live` 实时出警（含 GPS 地图、车内画面占位、就地登记）· `#events` 急救事件 · `#ambulances` 救护车列表 · `#register` 患者登记
- 指挥中枢「120 急救调度」二级菜单经 `nav-ia-enhance.js` 跳转到上述 Tab（含 **救护车列表**）

### 会议九项需求 · 本地 MVP 门户

**http://localhost:5173/meeting-portal.html**

- 动态面板、120 GPS+ETA、入院会诊、床位监控、设备绑定、质控、医生录入、发版清单、视频脚本
- Mock：`public/api/*.json` · 契约：`docs/API-CONTRACTS.md` · 路线图：`docs/MEETING-ROADMAP.md`

### 智慧城市 3D 态势演示（参考图 #2）

独立页面，不影响指挥中枢原版 UI：

**http://localhost:5173/smart-city.html**

- Three.js 威远县边界挤出地形、柱状「建筑」、节点间流动曲线
- 左右 ECharts：事件柱状图、趋势折线、处置进度仪表盘
- 中央浮动 HUD 标签（重点区域 / 事件告警 / 设施分布 / 数据流向）
- 页头可「返回指挥中枢」回到 `/#/`

## 本地资源（与线上一致）

| 路径 | 说明 |
|------|------|
| `public/assets/index-*.js` | 线上下载的完整前端包 |
| `public/assets/index-*.css` | 线上完整样式 |
| `public/scenario.json` | 演示患者 / 床位 / 预警等数据 |
| `public/maps/dafang.json` | 大方县边界 |
| `public/maps/weiyuan.json` | 威远县边界 |
| `reference/` | 对照用抓取文件 |

## 目录说明

- **根目录 `index.html`**：指向 `public/assets` 中的线上构建（当前 `npm run dev` 使用此入口）。
- **`src/`**：早期占位工程，后续可在此**逐页源码化**；不要与当前默认入口混淆。
- **`src/smart-city/`** + **`smart-city.html`**：智慧城市 3D 演示（React + Three.js + ECharts）。

## 构建 / 预览

```bash
npm run build
npm run preview
```

## 若线上更新了资源

重新下载并覆盖：

```bash
curl -L http://106.53.9.56:7775/assets/index-BA_IO3dC.js -o public/assets/index-BA_IO3dC.js
curl -L http://106.53.9.56:7775/assets/index-BRuArrdm.css -o public/assets/index-BRuArrdm.css
```

（若线上文件名 hash 变化，需同步改 `index.html` 里的引用。）
