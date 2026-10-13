# Copy — 华西县域急危重症指挥系统

本仓库用于独立维护与部署演示前端，**源码与文档均在子目录** [`huaxi-command-center/`](./huaxi-command-center/)。

## 快速开始

```bash
cd huaxi-command-center
npm install
npm run dev
```

详细说明、页面入口与 API 契约见 [huaxi-command-center/README.md](./huaxi-command-center/README.md)。

## 目录结构

| 路径 | 说明 |
|------|------|
| `huaxi-command-center/` | Vite 工程：源码、`public/` Mock、`docs/` 文档 |
| `huaxi-command-center/reference/` | 线上下载对照文件（非运行时依赖） |
| `huaxi-command-center/scripts/` | 构建补丁与一次性分析脚本 |

## 构建与发布

构建产物在 `huaxi-command-center/dist/`，**不提交到 Git**（见根目录 `.gitignore`）。

```bash
cd huaxi-command-center
npm run build
```

将 `dist/` 内容部署到静态站点或 GitHub Pages 即可。
