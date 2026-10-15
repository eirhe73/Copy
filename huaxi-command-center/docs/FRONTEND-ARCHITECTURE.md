# 前端架构说明

## 技术栈

| 类别 | 选型 |
|------|------|
| 构建 | Vite 8、TypeScript、oxlint |
| 主 SPA 演示 UI | React 19（**预编译 bundle**，`public/assets/vendor/index-BA_IO3dC.js`） |
| 迁移壳 | React 19 源码（`src/` + `src-shell.html`） |
| 子应用 | Vue 3（120 调度、GIS、会议门户等独立 HTML） |
| 地图 / 3D | Three.js、Leaflet、ECharts |
| 后端 | Laravel `/api/v1`，开发代理 `/backend-api`；运行时见 `public/assets/backend/` |

## 双入口（方案 B，团队默认遵守）

| 入口 | URL | React | 用途 |
|------|-----|-------|------|
| **演示 / 验收 / 部署** | **`/app.html#/`** | bundle | 完整业务界面 + 侧栏 + enhance |
| **源码 / API 联调** | **`/src-shell.html#/`** | `src/main.tsx` | 迁移中页面、`RouteApiWorkspace` 表格壳 |
| 登录 | `/index.html` | 无 | 提交后跳转 `app.html` |

**禁止**在 `app.html` 中改回 `/src/main.tsx`，否则多数路由会变成 API 字段表格。

## 渲染分层

```text
app.html
  ├─ vendor/index-BA_IO3dC.js     → React 业务页（Hash Router）
  ├─ backend/*.js                  → 鉴权、bridge、scenario
  ├─ theme/*.css                   → 浅色 + 侧栏网格
  └─ enhance/*.js                  → 侧栏 IA、会诊、地图、转诊…（改 DOM，非 React 树内）
```

侧栏 `sidebar-shell-enhance.js` 将 `aside.hx-sidebar` 挂在 **`body`** 上，避免 React 重渲染删除增强节点。

## 目录对照

| 路径 | 说明 |
|------|------|
| `app.html` | 主 SPA 装配单（HEAD 区块由 manifest 生成） |
| `config/app-shell.manifest.mjs` | `app.html` 样式 / backend / enhance 顺序 |
| `public/assets/vendor/` | 演示 React + CSS bundle |
| `public/assets/enhance/` | 产品化补丁脚本 |
| `public/assets/backend/` | API 与启动运行时 |
| `public/assets/theme/` | 全局主题 CSS |
| `src/` | 逐步替换 bundle 的 React 源码 |
| `src/dispatch-hub/`、`src/gis-command/` | Vue 子应用源码 |
| `reference/original-index.js` | bundle 对照（查路由/文案） |
| `docs/consultations-ia.md` 等 | 业务 IA 补充 |

## 常用命令

```bash
npm run dev              # 本地开发
npm run sync:app-html    # 根据 manifest 重写 app.html 脚本块
npm run build            # 多 HTML 入口构建 dist/
npm run restore:original # 重新下载 vendor bundle
```

## 演进方向（方案 C，长期）

按 `src/routes/meta.ts` 逐页把 bundle 行为迁入 `src/pages/*`，每完成一页可从 manifest 移除对应 enhance。完成前 **以 bundle + enhance 为交付标准**。
