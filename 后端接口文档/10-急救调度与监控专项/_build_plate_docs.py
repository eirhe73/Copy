# -*- coding: utf-8 -*-
"""Merge source API docs into plate-level standalone documents."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

SKIP_LINE = re.compile(
    r"详述文档|见《|见 \[|>\s*说明：.*见《|>\s*车辆台账表.*见 \[|>\s*本接口.*见 \[|"
    r"不重复建表|此处不重复|已并入本文件后续|剩余接口见《"
)


def read_rel(*parts: str) -> str:
    return (ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def strip_refs(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if SKIP_LINE.search(line):
            continue
        # drop markdown links to sibling docs only when whole line is a pointer
        if re.match(r"^>\s*\[.*\]\(\.\./", line):
            continue
        line = re.sub(r"\[([^\]]+)\]\(\.\./[^)]+\)", r"\1", line)
        lines.append(line)
    return "\n".join(lines)


def extract_from(text: str, start_marker: str, end_markers: list[str]) -> str:
    i = text.find(start_marker)
    if i < 0:
        return f"<!-- missing: {start_marker} -->\n"
    chunk = text[i:]
    end = len(chunk)
    for em in end_markers:
        j = chunk.find(em, len(start_marker))
        if j > 0:
            end = min(end, j)
    return chunk[:end].strip()


def section_api_blocks(text: str, prefix: str = "### ") -> str:
    """From '## 3. 接口' or similar through next ## at same/higher level."""
    m = re.search(r"^## [0-9]+\.\s*接口", text, re.M)
    if not m:
        return ""
    start = m.start()
    rest = text[start:]
    # stop at ## 4. or ## 5. etc after interfaces
    m2 = re.search(r"\n## [456789]\.\s", rest[10:])
    if m2:
        rest = rest[: 10 + m2.start()]
    return rest.strip()


def apis_by_heading(text: str, headings: list[str]) -> str:
    out = []
    for h in headings:
        pat = re.escape(h)
        m = re.search(rf"^{pat}\s*$", text, re.M)
        if not m:
            out.append(f"<!-- missing heading: {h} -->\n")
            continue
        start = m.start()
        m2 = re.search(r"^### [0-9]", text[start + len(h) :], re.M)
        m3 = re.search(r"^## [0-9]", text[start + len(h) :], re.M)
        end = len(text)
        if m2:
            end = start + len(h) + m2.start()
        elif m3:
            end = start + len(h) + m3.start()
        out.append(text[start:end].strip())
    return "\n\n---\n\n".join(out)


def main():
    dispatch_src = read_rel("01-指挥大屏", "02-院前急救调度接口.md")
    gis_src = read_rel("01-指挥大屏", "00-GIS协同态势接口.md")
    consult_src = read_rel("04-会诊协同", "01-会诊协同接口.md")
    transport_src = read_rel("01-指挥大屏", "03-转运与视频监控接口.md")
    patient_src = read_rel("03-患者与床位", "02-患者管理接口.md")

    warn_src = read_rel("02-预警与重症", "01-预警中心接口.md")
    bed_src = read_rel("03-患者与床位", "01-床位管理接口.md")
    org_src = read_rel("06-机构与配置", "01-机构管理接口.md")
    device_src = read_rel("06-机构与配置", "03-设备管理接口.md")
    bind_src = read_rel("04-会诊协同", "02-床患设备绑定接口.md")
    center_src = read_rel("06-机构与配置", "02-救治中心接口.md")
    critical_src = read_rel("02-预警与重症", "02-重症监护接口.md")
    msg_src = read_rel("06-机构与配置", "04-消息中心接口.md")
    dash_src = read_rel("01-指挥大屏", "01-指挥大屏总览接口.md")

    # --- Dispatch plate ---
    d_model = extract_from(dispatch_src, "## 2. 数据模型", ["## 3. 接口"])
    d_apis = extract_from(dispatch_src, "## 3. 接口清单", ["## 4. 状态"])
    d_supp = extract_from(dispatch_src, "### 3.5 创建急救事件", ["## 9.", "## 10.", "## 4. 状态"])
    if len(d_supp) < 500:
        d_supp = extract_from(dispatch_src, "## 8. 补充接口清单", ["## 9."])
    d_enum = extract_from(dispatch_src, "## 4. 状态与枚举", ["## 5. 交互"])
    d_logic = extract_from(dispatch_src, "## 5. 交互与边界", ["## 6. 前端"])
    d_front = extract_from(dispatch_src, "## 6. 前端对接", ["## 7."])

    gps_api = apis_by_heading(gis_src, ["### 3.2 获取在途车辆 GPS 与 ETA"])
    consult_model = extract_from(consult_src, "## 2. 数据模型", ["## 3. 接口"])
    consult_apis = apis_by_heading(
        consult_src,
        [
            "### 3.1 获取入院会诊会话",
            "### 5.1 获取会诊队列",
            "### 5.2 获取会诊详情",
            "### 5.3 发起会诊",
            "### 5.4 医生接诊",
            "### 5.5 获取接诊医生",
            "### 5.6 获取会诊室信息",
            "### 5.7 获取临床资料",
            "### 5.8 提交会诊意见",
            "### 5.9 患者加入会诊",
        ],
    )
    consult_enum = extract_from(consult_src, "## 6. 状态与枚举", ["## 7."])

    monitor_apis = apis_by_heading(
        transport_src,
        [
            "### 3.2 轨迹回放",
            "### 3.4 监控流列表",
            "### 3.5 单路监控画面",
            "### 3.6 云台控制",
        ],
    )

    patient_prehospital = extract_from(
        patient_src, "### 2.4 院前上报对象", ["### 3.2 获取患者列表"]
    )
    patient_reg = apis_by_heading(
        patient_src,
        [
            "### 3.1 急救医生快速登记（急诊患者）",
            "### 3.8 身份证 OCR 识别",
            "### 3.11 院前信息上报",
        ],
    )
    amb_list_detail = apis_by_heading(
        dispatch_src, ["### 3.3 获取救护车列表", "### 3.8 救护车详情"]
    )

    dispatch_doc = f"""# 急救调度板块 · 接口文档（完整版）

> 版本：v2.0  
> 编制日期：2026-10-13  
> 范围：产品 IA「急救调度」1.1～1.5 全部接口（字段、参数、响应、业务规则自包含）  
> 基础路径：`/api/v1` · 认证：Sanctum Bearer · 响应：`{{"code":200,"message":"success","data":{{}}}}`

---

## 1. 板块与子模块

| 编号 | 子模块 | 前端入口 |
|------|--------|----------|
| 1.1 | 急救事件 | `dispatch.html#events` |
| 1.2 | 实时出警 | `dispatch.html#live`（10s 轮询） |
| 1.3 | 远程会诊 | `/#/consultations`、`/#/room/:token` |
| 1.4 | 患者登记 | `dispatch.html#register`、`#live` 就地登记 |
| 1.5 | 车辆监控 | `dispatch.html#monitor`（GPS 5s 轮询） |

---

## 2. 数据模型（院前调度）

{strip_refs(d_model)}

---

## 3. 数据模型（远程会诊）

{strip_refs(consult_model)}

---

## 4. 状态与枚举

{strip_refs(d_enum)}

{strip_refs(consult_enum)}

---

## 5. 接口 · 1.1 急救事件 & 1.2 实时出警

> 两子模块共用事件/车辆接口；实时出警额外轮询列表并拉取详情。

{strip_refs(d_apis)}

{strip_refs(d_supp)}

---

## 6. 接口 · 1.3 远程会诊

{strip_refs(consult_apis)}

---

## 7. 接口 · 1.4 患者登记

### 7.1 车上就地登记

{strip_refs(apis_by_heading(dispatch_src, ["### 3.4 提交/保存急救患者登记"]))}

### 7.2 院前上报字段模型

{strip_refs(patient_prehospital)}

### 7.3 院内登记、OCR、院前上报

{strip_refs(patient_reg)}

---

## 8. 接口 · 1.5 车辆监控

{strip_refs(gps_api)}

{strip_refs(amb_list_detail)}

{strip_refs(monitor_apis)}

---

## 9. 交互与业务规则

{strip_refs(d_logic)}

---

## 10. 前端对接说明

{strip_refs(d_front)}
"""

    # --- Monitor plate ---
    w_model = extract_from(warn_src, "## 2. 数据模型", ["## 3. 接口"])
    w_apis = section_api_blocks(warn_src)
    w_enum = extract_from(warn_src, "## 4.", ["## 5."]) if "## 4." in warn_src else ""

    bed_model = extract_from(bed_src, "## 2. 数据模型", ["## 3. 接口"])
    bed_apis = section_api_blocks(bed_src)

    org_apis = apis_by_heading(
        org_src,
        ["### 3.1 获取机构列表", "### 3.4 获取科室结构", "### 3.5 获取机构权限范围"],
    )

    device_model = extract_from(device_src, "## 2. 数据模型", ["## 3. 接口"])
    device_apis = section_api_blocks(device_src)
    device_apis += "\n\n---\n\n" + strip_refs(
        extract_from(device_src, "## 5. 接口清单（续）", ["## 6."])
    )
    device_apis += "\n\n---\n\n" + strip_refs(
        extract_from(device_src, "### 4.1 设备巡检记录表", ["## 5."])
    )
    bind_apis = section_api_blocks(bind_src)

    center_model = extract_from(center_src, "## 2. 数据模型", ["## 3. 接口"])
    center_apis = section_api_blocks(center_src)

    crit_model = extract_from(critical_src, "## 2. 数据模型", ["## 3. 接口"])
    crit_apis = section_api_blocks(critical_src)
    crit_apis += "\n\n---\n\n" + strip_refs(
        apis_by_heading(transport_src, ["### 3.4 监控流列表", "### 3.5 单路监控画面"])
    )

    msg_model = extract_from(msg_src, "## 2. 数据模型", ["## 3. 接口"])
    msg_apis = section_api_blocks(msg_src)

    county_api = apis_by_heading(dash_src, ["### 3.5 县域地图聚合"])

    monitor_doc = f"""# 急救监控板块 · 接口文档（完整版）

> 版本：v2.0  
> 编制日期：2026-10-13  
> 范围：产品 IA「急救监控」2.1～2.7 全部接口（自包含）  
> 基础路径：`/api/v1` · 认证：Sanctum Bearer

---

## 1. 板块与子模块

| 编号 | 子模块 | 前端入口 |
|------|--------|----------|
| 2.1 | 预警通知 | `/#/warning`、`/#/messages` |
| 2.2 | 科室监控 | `/#/beds`、`/#/critical` |
| 2.3 | 下级医院科室监控 | 机构切换 + `scope=LOWER` |
| 2.4 | 床位监控 | `meeting-portal.html#beds` |
| 2.5 | 床旁设备绑定 | `/#/devices` |
| 2.6 | 五大中心 | `/#/centers` |
| 2.7 | 基层重症监护 | `/#/critical` |

---

## 2. 数据模型 · 预警

{strip_refs(w_model)}

---

## 3. 数据模型 · 床位

{strip_refs(bed_model)}

---

## 4. 数据模型 · 设备与四元绑定

{strip_refs(device_model)}

{strip_refs(extract_from(bind_src, "## 2. 数据模型", ["## 3. 接口"]))}

---

## 5. 数据模型 · 五大中心

{strip_refs(center_model)}

---

## 6. 数据模型 · 重症监护

{strip_refs(crit_model)}

---

## 7. 数据模型 · 消息中心

{strip_refs(msg_model)}

---

## 8. 接口 · 2.1 预警通知

{strip_refs(w_apis)}

---

## 9. 接口 · 2.1 预警通知（消息触达）

{strip_refs(msg_apis)}

---

## 10. 接口 · 2.2 科室监控 & 2.4 床位监控

{strip_refs(bed_apis)}

---

## 11. 接口 · 2.3 下级医院科室监控

{strip_refs(org_apis)}

### 11.1 县域地图节点（可选）

{strip_refs(county_api)}

### 11.2 下级绑定查询

{strip_refs(bind_apis)}

> 调用 `GET /api/v1/care-bindings` 时 Query 传 `scope=LOWER`；`GET /api/v1/beds/by-dept` 传下级 `hospitalId`。

---

## 12. 接口 · 2.5 床旁设备绑定

{strip_refs(device_apis)}

---

## 13. 接口 · 2.6 五大中心

{strip_refs(center_apis)}

---

## 14. 接口 · 2.7 基层重症监护

{strip_refs(crit_apis)}

---

## 15. 数据权限（下级机构）

| 角色 | 本院科室 | 下级医院 |
|------|----------|----------|
| 县级管理员 | 全部 | 全部下级 |
| 乡镇/中心院 | 本机构 | 辖内基层 |
| 基层医生 | 本机构 | 无跨机构 |

{strip_refs(w_enum)}
"""

    out_dir = Path(__file__).resolve().parent
    (out_dir / "01-急救调度板块接口.md").write_text(dispatch_doc, encoding="utf-8")
    (out_dir / "02-急救监控板块接口.md").write_text(monitor_doc, encoding="utf-8")
    print("wrote", out_dir / "01-急救调度板块接口.md", len(dispatch_doc))
    print("wrote", out_dir / "02-急救监控板块接口.md", len(monitor_doc))


if __name__ == "__main__":
    main()
