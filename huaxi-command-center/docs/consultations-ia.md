# 远程会诊 · 单页工作台

**入口**：侧栏一项「远程会诊」→ `#/consultations`（enhance 接管 React 演示列表）。

**页内结构（同一屏）**

1. **范围 Tab**：基层上转待办 | 全县会诊（`?tab=grassroots` / 无 tab 或全县）
2. **发起会诊**：右上角按钮展开表单（120 跳转可用 `?launch=1` 自动展开）
3. **队列状态 Tab**：待接诊 / 会诊中 / 定时 / 已结束 / 全部
4. **接诊**：确认弹层后 `POST .../accept`（当前登录用户认领）

**兼容**：`#/consultations/grassroots|county|new` 会自动重定向回本页并带上对应 tab / launch。

**不在此页**：会诊室 `#/room/:token`、选患者 `#/consultations/pick`、档案 / 转诊链跳转。
