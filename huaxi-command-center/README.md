# 华西 · 县域急危重症救治一体化指挥中心



## 方案一（当前默认）



| 入口 | 说明 |

|------|------|

| **`index.html`** | **与截图一致的线上 UI**（`index-BA_IO3dC.js` + 全套 backend / map enhance） |

| **`src-shell.html`** | **React 源码壳**（`src/` 重写 30 页，迁移中，视觉尚未 1:1） |

| **`index.devtools.html`** | 早期 JSON 调试入口（可选） |



- 演示 / 验收：`npm run dev` → **http://localhost:5173/#/**（默认 `index.html`）

- 源码开发：**http://localhost:5173/src-shell.html#/**

- API：开发走 `/backend-api` 代理 → `62.234.128.72:7824`（见 `vite.config.ts`）

- 环境：复制 `.env.example` 为 `.env`；`src/bootstrap/backend-env.ts` 在 bridge 前写入 `huaxi-api-*` / `huaxi-full-backend`



### 源码目录（逐步替换 bundle 用）



| 路径 | 作用 |

|------|------|

| `src/lib/apiClient.ts` | TypeScript JWT 客户端（与 bridge 同前缀） |

| `src/routes/meta.ts` | 30 条路由元数据 |

| `src/routes/apiBindings.ts` | 每页 GET 绑定（与 `backend-api-catalog.js` 对齐） |

| `src/context/AuthContext.tsx` | 登录 / `/auth/me` |

| `public/assets/backend-*.js` | 演示包运行时后端对接（读写在生产入口生效） |



演示包无 React 源码时，**视觉与交互以 bundle 为准**；`src/pages/*` 为 API 调试壳，待逐页源码化。



## 快速开始



```bash

cd huaxi-command-center

npm install

npm run dev

```



### 开发：点击页面跳转源码（code-inspector）



仅在 `npm run dev` 下生效。



- **指挥中枢演示 UI**（`index.html`）加载的是 `public/assets/index-BA_IO3dC.js`，无法精确跳到 bundle 内组件。

- 可点击跳转：`dispatch.html`、`gis-command.html`、`meeting-portal.html`、`smart-city.html` 及 `index.devtools.html` 中的 `src/` 页面。



### 大方县医疗协同 GIS 指挥大屏（Vue3 + ECharts）



**http://localhost:5173/gis-command.html**



### 120 急救调度 · 四页工作台



**http://localhost:5173/dispatch.html**



### 会议九项需求 · 本地 MVP 门户



**http://localhost:5173/meeting-portal.html**



### 智慧城市 3D 态势演示



**http://localhost:5173/smart-city.html**



## 本地资源



| 路径 | 说明 |

|------|------|

| `public/assets/index-*.js` / `*.css` | 线上下载的完整前端包 |

| `public/scenario.json` | 演示数据（全后端模式下由 bridge 同步覆盖） |

| `reference/original-index.js` | 未压缩对照（查路由/文案） |



`npm run restore:original` 可重新拉取远程 bundle。3D 地图补丁：`npm run patch:map`。后端探针：`npm run verify:backend-api`。



## 构建 / 预览



```bash

npm run build

npm run preview

```



构建产物含 `index.html`（演示 UI）、`index.devtools.html`（React 导航）及子应用 HTML。



## 若线上更新了资源



```bash

npm run restore:original

```



若 hash 变化，需同步改 `index.html` / `index.legacy.html` 中的 `index-*.js` / `css` 文件名。

