# 远程会诊 vs 基层会诊 · 两套 UI（产品定稿）

| 菜单 | Hash | 界面 (用户口径) | 实现 |
|------|------|-----------------|------|
| **远程会诊** | `#/consultations` | **p2**：React「科室待接诊」卡片、指定医生、确认分配 | `index-BA_IO3dC.js` + `consult-list-polish` / `consult-queue-actions` |
| **基层会诊** | `#/consultations?tab=grassroots` | **p1**：API 工作台表格、发起会诊（无页内「全县/基层」Tab，混排走远程会诊） | `consult-workbench-enhance.js` |

- 顶栏/侧栏在两项之间切换 hash，**不在页内再插一套重复 Tab**。
- 120「发起远程会诊」→ `#/consultations?task&…&launch=1`（**远程会诊 p2**，无 `tab=grassroots`）。
- 会诊室、选患者：`#/room/…`、`#/consultations/pick?tab=grassroots&…` 不变。
