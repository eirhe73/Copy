/**
 * 床旁设备（#/devices）列表与编辑弹窗补丁
 *
 * 为什么打补丁而不是写 enhance 脚本：
 * 该页由预编译产物 index-BA_IO3dC.js 渲染（组件 rfe），筛选与表格都是 React 状态驱动，
 * DOM 层增强会在每次重渲染时被冲掉。这里沿用 scripts/patch-map-3d.mjs 的做法，
 * 用字符串替换把 rfe 换成增强版——仍是同一模块作用域，可继续用 Fn/Yt/VH/yt/ln/on/di/kt/In 等既有导出。
 *
 * 变更点：
 *  1) 列：新增「绑定科室」「关联医生」
 *  2) 筛选：新增「关联医生」「关联患者」
 *  3) 操作列：绑定床位 → 编辑；弹窗含列表全部字段（只读设备信息 + 机构/绑定科室/关联床位/关联医生/关联患者）
 *  4) 下拉一律保持「有选中项」（切机构/科室后自动落到该范围的第一条），避免 React 受控 select 与实际状态不一致
 *  5) <main data-hx-devices-edit="1"> 作为「已打补丁」标记，供 enhance 脚本判断
 *
 * 幂等：每次从 `function rfe(){` 切到 `function ife(){`，再写回新实现。
 */
import fs from 'fs'
import path from 'path'

const jsPath = path.join('public', 'assets', 'vendor', 'index-BA_IO3dC.js')
const START = 'function rfe(){'
const END = 'function ife(){'

const NEW_SOURCE = `function rfe(){
  const HX_BIND_KEY = "huaxi-demo-device-bindings";
  const { beds: hxBeds, patients: hxPatients } = Fn();
  const { session: hxSession, notify: hxNotify, state: hxState } = Yt();
  const hxStaff = hxState && hxState.staff ? VH(hxState, hxSession) : [];
  const [hxEditId, setHxEditId] = U.useState("");
  const [hxDraft, setHxDraft] = U.useState(null);
  const [hxType, setHxType] = U.useState("全部");
  const [hxDoctor, setHxDoctor] = U.useState("全部");
  const [hxPatient, setHxPatient] = U.useState("全部");
  const [hxBindings, setHxBindings] = U.useState(function () {
    try {
      return JSON.parse(localStorage.getItem(HX_BIND_KEY) || "{}");
    } catch (e) {
      return {};
    }
  });
  function hxDedupe(list, keyFn, labelFn) {
    const seen = new Map();
    list.forEach(function (x) {
      const k = keyFn(x);
      if (k && !seen.has(k)) seen.set(k, labelFn(x));
    });
    return [...seen.entries()].map(function (pair) {
      return { value: pair[0], label: pair[1] };
    });
  }
  function hxOpts(pairs) {
    return pairs.map(function (p) {
      return s.jsx("option", { value: p.value, children: p.label }, p.value);
    });
  }
  function hxOrgName(id) {
    return id ? yt(id) : "—";
  }
  function hxDeptName(institutionId, departmentId) {
    return departmentId ? ln(institutionId, departmentId) : "—";
  }
  function hxPatientOfBed(bed) {
    return bed && bed.patientId ? hxPatients.find(function (p) { return p.id === bed.patientId; }) || null : null;
  }
  function hxFirstDept(institutionId) {
    const b = hxBeds.find(function (x) { return x.institutionId === institutionId; });
    return b ? b.departmentId : "";
  }
  function hxFirstBed(institutionId, departmentId) {
    return hxBeds.find(function (x) { return x.institutionId === institutionId && (!departmentId || x.departmentId === departmentId); }) || null;
  }
  function hxBindOf(devId, bed) {
    const raw = hxBindings[devId];
    const fallback = { bedId: bed.id, institutionId: bed.institutionId, departmentId: bed.departmentId, doctorId: "", patientId: "" };
    if (!raw) return fallback;
    if (typeof raw === "string") return { ...fallback, bedId: raw };
    return {
      bedId: raw.bedId || bed.id,
      institutionId: raw.institutionId || bed.institutionId,
      departmentId: raw.departmentId || bed.departmentId,
      doctorId: raw.doctorId || "",
      patientId: raw.patientId || ""
    };
  }
  const hxDevices = hxBeds.flatMap(function (bed) {
    return [
      { id: "MON-" + bed.id, type: "监护仪", bed: bed },
      { id: "CAM-" + bed.id, type: "床旁摄像头", bed: bed }
    ];
  });
  const hxRows = hxDevices.map(function (dev) {
    const bind = hxBindOf(dev.id, dev.bed);
    const boundBed = hxBeds.find(function (b) { return b.id === bind.bedId; }) || dev.bed;
    const doctor = hxStaff.find(function (x) { return x.id === bind.doctorId; }) || null;
    const patientId = bind.patientId || boundBed.patientId || "";
    const patient = patientId ? hxPatients.find(function (p) { return p.id === patientId; }) || null : null;
    return { dev: dev, bind: bind, boundBed: boundBed, doctor: doctor, patient: patient, patientId: patientId, bound: !!hxBindings[dev.id] };
  });
  const hxDoctorOpts = hxDedupe(
    hxRows.filter(function (r) { return r.bind.doctorId; }),
    function (r) { return r.bind.doctorId; },
    function (r) { return r.doctor ? r.doctor.name : r.bind.doctorId; }
  );
  const hxPatientOpts = hxDedupe(
    hxRows.filter(function (r) { return r.patientId; }),
    function (r) { return r.patientId; },
    function (r) { return r.patient ? r.patient.name : r.patientId; }
  );
  const hxDoctorValue = hxDoctor === "全部" || hxDoctorOpts.some(function (p) { return p.value === hxDoctor; }) ? hxDoctor : "全部";
  const hxPatientValue = hxPatient === "全部" || hxPatientOpts.some(function (p) { return p.value === hxPatient; }) ? hxPatient : "全部";
  const hxVisible = hxRows.filter(function (r) {
    return (hxType === "全部" || r.dev.type === hxType) && (hxDoctorValue === "全部" || r.bind.doctorId === hxDoctorValue) && (hxPatientValue === "全部" || r.patientId === hxPatientValue);
  });
  const hxEditRow = hxEditId ? hxRows.find(function (r) { return r.dev.id === hxEditId; }) || null : null;
  const hxView = hxDraft ? hxBuildView(hxDraft, hxEditRow) : null;
  function hxBuildView(draft, row) {
    const orgPairs = [...new Set(hxBeds.map(function (b) { return b.institutionId; }))].map(function (id) {
      return { value: id, label: hxOrgName(id) };
    });
    const deptPairs = [...new Set(hxBeds.filter(function (b) { return b.institutionId === draft.institutionId; }).map(function (b) { return b.departmentId; }))].map(function (id) {
      return { value: id, label: hxDeptName(draft.institutionId, id) };
    });
    if (draft.departmentId && !deptPairs.some(function (p) { return p.value === draft.departmentId; })) {
      deptPairs.push({ value: draft.departmentId, label: hxDeptName(draft.institutionId, draft.departmentId) });
    }
    const bedPairs = hxBeds
      .filter(function (b) { return b.institutionId === draft.institutionId && (!draft.departmentId || b.departmentId === draft.departmentId); })
      .map(function (b) {
        const occ = hxPatientOfBed(b);
        return { value: b.id, label: b.label + (occ ? " · " + occ.name : b.status === "occupied" ? " · 占用" : " · 空床") };
      });
    if (draft.bedId && !bedPairs.some(function (p) { return p.value === draft.bedId; })) {
      bedPairs.unshift({ value: draft.bedId, label: (row && row.boundBed ? row.boundBed.label : draft.bedId) + "（当前绑定）" });
    }
    const doctors = hxStaff.filter(function (x) { return String(x.profession || "").toLowerCase() === "doctor"; });
    const byDept = doctors.filter(function (x) { return x.institutionId === draft.institutionId && (!draft.departmentId || x.departmentId === draft.departmentId); });
    const byOrg = doctors.filter(function (x) { return x.institutionId === draft.institutionId; });
    const doctorPairs = [{ value: "", label: "暂不指定医生" }].concat((byDept.length ? byDept : byOrg.length ? byOrg : doctors).map(function (x) {
      return { value: x.id, label: x.name + " · 医生" };
    }));
    if (draft.doctorId && !doctorPairs.some(function (p) { return p.value === draft.doctorId; })) {
      doctorPairs.push({ value: draft.doctorId, label: (row && row.doctor ? row.doctor.name : draft.doctorId) + "（当前绑定）" });
    }
    const inOrg = hxPatients.filter(function (p) { return p.institutionId === draft.institutionId; });
    const patientPairs = [{ value: "", label: "不绑定患者" }].concat((inOrg.length ? inOrg : hxPatients).map(function (p) {
      return { value: p.id, label: p.name + " · " + hxDeptName(p.institutionId, p.departmentId) };
    }));
    if (draft.patientId && !patientPairs.some(function (p) { return p.value === draft.patientId; })) {
      patientPairs.push({ value: draft.patientId, label: (row && row.patient ? row.patient.name : draft.patientId) + "（当前绑定）" });
    }
    function pick(pairs, value, allowEmpty) {
      if (value && pairs.some(function (p) { return p.value === value; })) return value;
      if (allowEmpty) return "";
      return pairs.length ? pairs[0].value : "";
    }
    return {
      orgPairs: orgPairs,
      deptPairs: deptPairs,
      bedPairs: bedPairs,
      doctorPairs: doctorPairs,
      patientPairs: patientPairs,
      deptValue: pick(deptPairs, draft.departmentId, false),
      bedValue: pick(bedPairs, draft.bedId, false),
      doctorValue: pick(doctorPairs, draft.doctorId, true),
      patientValue: pick(patientPairs, draft.patientId, true)
    };
  }
  function hxOpen(devId) {
    const row = hxRows.find(function (r) { return r.dev.id === devId; });
    if (!row) return;
    setHxEditId(devId);
    setHxDraft({
      institutionId: row.bind.institutionId,
      departmentId: row.bind.departmentId,
      bedId: row.bind.bedId,
      doctorId: row.bind.doctorId,
      patientId: row.patientId
    });
  }
  function hxClose() {
    setHxEditId("");
    setHxDraft(null);
  }
  function hxSave() {
    const draft = hxDraft;
    const view = hxView;
    if (!draft || !view || !hxEditId) return;
    const bedId = view.bedValue;
    if (!bedId) {
      hxNotify("请先选择关联床位。");
      return;
    }
    const bed = hxBeds.find(function (b) { return b.id === bedId; }) || null;
    const doctor = hxStaff.find(function (x) { return x.id === view.doctorValue; }) || null;
    const patient = hxPatients.find(function (p) { return p.id === view.patientValue; }) || null;
    const next = {
      ...hxBindings,
      [hxEditId]: {
        bedId: bedId,
        institutionId: draft.institutionId,
        departmentId: view.deptValue,
        doctorId: view.doctorValue,
        patientId: view.patientValue
      }
    };
    try {
      localStorage.setItem(HX_BIND_KEY, JSON.stringify(next));
    } catch (e) {
      hxNotify("保存失败。");
      return;
    }
    setHxBindings(next);
    hxClose();
    hxNotify("已保存：" + (bed ? bed.label : bedId) + (doctor ? " · 关联医生 " + doctor.name : "") + (patient ? " · 关联患者 " + patient.name : "") + "（本地演示台账，设备连接状态未改变）");
  }
  function hxModal(row) {
    const view = hxView;
    if (!row || !view) return null;
    return s.jsxs(
      di,
      {
        title: "编辑设备绑定",
        wide: true,
        onClose: hxClose,
        children: [
          s.jsxs("div", { className: "hx-device-bind-form", children: [
            s.jsxs("p", { className: "hx-device-bind-form__lead", children: [
              "编辑该演示设备的绑定关系：",
              s.jsx("strong", { children: "机构 → 绑定科室 → 关联床位" }),
              "，并按需指定 ",
              s.jsx("strong", { children: "关联医生" }),
              " 与 ",
              s.jsx("strong", { children: "关联患者" }),
              "。保存后列表对应列立即更新。"
            ] }),
            s.jsxs("p", { className: "hx-device-bind-form__device", children: [
              "设备编号：",
              s.jsx("code", { children: row.dev.id }),
              " · 设备类型：",
              s.jsx("strong", { children: row.dev.type }),
              " · 采集状态：",
              s.jsx("strong", { children: "未连接" })
            ] }),
            s.jsxs("div", { className: "hx-device-bind-form__grid", children: [
              s.jsx(on, {
                label: "机构",
                value: hxDraft.institutionId,
                onChange: function (v) {
                  const dept = hxFirstDept(v);
                  const bed = hxFirstBed(v, dept);
                  const occ = hxPatientOfBed(bed);
                  setHxDraft({ institutionId: v, departmentId: dept, bedId: bed ? bed.id : "", doctorId: "", patientId: occ ? occ.id : "" });
                },
                children: hxOpts(view.orgPairs)
              }),
              s.jsx(on, {
                label: "绑定科室",
                value: view.deptValue,
                onChange: function (v) {
                  const bed = hxFirstBed(hxDraft.institutionId, v);
                  const occ = hxPatientOfBed(bed);
                  setHxDraft({ ...hxDraft, departmentId: v, bedId: bed ? bed.id : "", doctorId: "", patientId: occ ? occ.id : "" });
                },
                children: view.deptPairs.length ? hxOpts(view.deptPairs) : s.jsx("option", { value: "", children: "—" })
              }),
              s.jsx(on, {
                label: "关联床位",
                value: view.bedValue,
                onChange: function (v) {
                  const bed = hxBeds.find(function (b) { return b.id === v; });
                  const occ = hxPatientOfBed(bed);
                  setHxDraft({ ...hxDraft, bedId: v, patientId: occ ? occ.id : "" });
                },
                children: view.bedPairs.length ? hxOpts(view.bedPairs) : s.jsx("option", { value: "", children: "—" })
              }),
              s.jsx(on, {
                label: "关联医生",
                value: view.doctorValue,
                onChange: function (v) { setHxDraft({ ...hxDraft, doctorId: v }); },
                children: hxOpts(view.doctorPairs)
              }),
              s.jsx(on, {
                label: "关联患者",
                value: view.patientValue,
                onChange: function (v) { setHxDraft({ ...hxDraft, patientId: v }); },
                children: hxOpts(view.patientPairs)
              })
            ] }),
            s.jsx("p", { className: "hx-device-bind-hint__sub", children: "演示设备未接真实物联网：编辑绑定只写入本机 localStorage，采集状态不会因此变为在线。" })
          ] }),
          s.jsxs("div", { className: "form-footer", children: [
            s.jsx("button", { onClick: hxClose, children: "取消" }),
            s.jsx("button", { className: "primary", onClick: hxSave, children: "保存" })
          ] })
        ]
      },
      "hx-device-edit-modal"
    );
  }
  return s.jsxs(s.Fragment, {
    children: [
      s.jsx(Qn, { line: 2 }),
      s.jsxs("main", {
        className: "workspace",
        "data-hx-devices-edit": "1",
        children: [
          s.jsxs("header", { className: "workspace-heading", children: [
            s.jsx("h1", { children: "床旁设备与绑定" }),
            s.jsx(kt, { color: "amber", children: "采集设备未连接" })
          ] }),
          s.jsxs("div", { className: "filter-bar", children: [
            s.jsx(on, {
              label: "设备类型",
              value: hxType,
              onChange: setHxType,
              children: ["全部", "监护仪", "床旁摄像头"].map(function (t) { return s.jsx("option", { children: t }, t); })
            }),
            s.jsx(on, {
              label: "关联医生",
              value: hxDoctorValue,
              onChange: setHxDoctor,
              children: [s.jsx("option", { value: "全部", children: "全部" })].concat(hxDoctorOpts.length ? hxOpts(hxDoctorOpts) : [s.jsx("option", { value: "", children: "暂无已绑定医生", disabled: true }, "none")])
            }),
            s.jsx(on, {
              label: "关联患者",
              value: hxPatientValue,
              onChange: setHxPatient,
              children: [s.jsx("option", { value: "全部", children: "全部" })].concat(hxPatientOpts.length ? hxOpts(hxPatientOpts) : [s.jsx("option", { value: "", children: "暂无已绑定患者", disabled: true }, "none")])
            })
          ] }),
          s.jsx("div", { className: "business-table table-scroll", children: s.jsxs("table", {
            children: [
              s.jsx("thead", { children: s.jsxs("tr", { children: [
                s.jsx("th", { children: "设备编号（演示）" }),
                s.jsx("th", { children: "设备类型" }),
                s.jsx("th", { children: "所属科室" }),
                s.jsx("th", { children: "绑定科室" }),
                s.jsx("th", { children: "关联床位" }),
                s.jsx("th", { children: "关联医生" }),
                s.jsx("th", { children: "关联患者" }),
                s.jsx("th", { children: "采集状态" }),
                s.jsx("th", { children: "操作" })
              ] }) }),
              s.jsx("tbody", { children: hxVisible.map(function (r) {
                return s.jsxs("tr", { children: [
                  s.jsx("td", { children: r.dev.id }),
                  s.jsx("td", { children: r.dev.type }),
                  s.jsxs("td", { children: [
                    hxOrgName(r.dev.bed.institutionId),
                    s.jsx("small", { children: hxDeptName(r.dev.bed.institutionId, r.dev.bed.departmentId) })
                  ] }),
                  s.jsxs("td", { title: "编辑弹窗中选择的机构 / 科室", children: [
                    hxDeptName(r.bind.institutionId, r.bind.departmentId),
                    s.jsx("small", { children: hxOrgName(r.bind.institutionId) })
                  ] }),
                  s.jsx("td", { children: r.boundBed ? r.boundBed.label : "—" }),
                  s.jsx("td", { title: r.doctor ? "关联医生 " + r.doctor.name : "未指定关联医生", children: r.doctor ? r.doctor.name : "—" }),
                  s.jsx("td", { title: r.patient ? "关联患者 " + r.patient.name : "未绑定患者", children: r.patient ? r.patient.name : "—" }),
                  s.jsx("td", { children: s.jsx(kt, { color: "muted", children: "未连接" }) }),
                  s.jsx("td", { children: s.jsx("button", { title: "打开弹窗：机构 / 绑定科室 / 关联床位 / 关联医生 / 关联患者", onClick: function () { hxOpen(r.dev.id); }, children: "编辑" }) })
                ] }, r.dev.id);
              }) })
            ]
          }) }),
          !hxVisible.length && s.jsx(In, { children: hxRows.length ? "当前筛选条件下暂无设备" : "当前范围暂无床位设备" })
        ]
      }),
      hxEditId && hxEditRow && hxView ? hxModal(hxEditRow) : null
    ]
  });
}
`

let js = fs.readFileSync(jsPath, 'utf8')
const start = js.indexOf(START)
if (start < 0) {
  console.error('未找到 ' + START + '，终止。')
  process.exit(1)
}
const end = js.indexOf(END, start)
if (end < 0) {
  console.error('未找到 ' + END + '，终止。')
  process.exit(1)
}
js = js.slice(0, start) + NEW_SOURCE + js.slice(end)
fs.writeFileSync(jsPath, js)
console.log('devices page patched:', end - start, '->', NEW_SOURCE.length, 'chars')
