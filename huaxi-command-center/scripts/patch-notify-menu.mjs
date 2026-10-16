/**
 * 底栏「通知」悬浮预览面板
 *
 * 需求：鼠标悬浮底栏「通知」时弹出类似 #/messages 的消息列表；点某条消息，
 * 跳到「查看患者与处置」同样的目标（患者档案 /patient/<id>）。
 *
 * 做法沿用 scripts/patch-devices-page.mjs：直接给预编译产物打字符串补丁，
 * 这样能复用 React 上下文里的 Fn()（当前账号可见的 alerts / patients）与既有
 * 组件 Ft(Link) / Vl(Bell) / ln(机构科室名)，不用在 enhance 脚本里重算可见范围。
 *
 * 改动：
 *  1) 在根组件 zpe 前插入组件 hxNotifMenu（哨兵注释包裹，便于重复打补丁）
 *  2) 底栏 `通知` 链接换成 <hxNotifMenu icon=Bell/>（仍是 Link → /messages）
 *
 * 幂等：先删旧哨兵块，再插入；页脚片段已替换过则跳过第二次替换。
 */
import fs from 'fs'
import path from 'path'

const jsPath = path.join('public', 'assets', 'vendor', 'index-BA_IO3dC.js')
const BLOCK_START = '/* HX-NOTIF-BEGIN */'
const BLOCK_END = '/* HX-NOTIF-END */'
const ANCHOR = 'function zpe('
const FOOTER_FROM = 's.jsxs(Ft,{to:"/messages",children:[s.jsx(Vl,{size:12}),"通知"]})'
const FOOTER_TO = 's.jsx(hxNotifMenu,{icon:s.jsx(Vl,{size:12})})'

const STATUS_LABEL = '{new:"待测评",acknowledged:"待干预",treating:"待复评",resolved:"已处置"}'

const BLOCK = `${BLOCK_START}
function hxNotifStamp(at){
  if(!at) return "—";
  const d=new Date(at);
  if(isNaN(d.getTime())) return String(at);
  const p=function(n){return n<10?"0"+n:""+n;};
  return d.getMonth()+1+"/"+d.getDate()+" "+p(d.getHours())+":"+p(d.getMinutes());
}
function hxNotifPlace(patient){
  return patient?ln(patient.institutionId,patient.departmentId):"—";
}
function hxNotifMenu(props){
  const lists=Fn();
  const alerts=(lists&&lists.alerts)||[];
  const patients=(lists&&lists.patients)||[];
  const [open,setOpen]=U.useState(false);
  const timer=U.useRef(null);
  function clear(){if(timer.current){clearTimeout(timer.current);timer.current=null;}}
  function enter(){clear();setOpen(true);}
  function leave(){clear();timer.current=setTimeout(function(){setOpen(false);},160);}
  U.useEffect(function(){return clear;},[]);
  const sorted=[...alerts].sort(function(a,b){return String(b.createdAt||"").localeCompare(String(a.createdAt||""));});
  const pending=sorted.filter(function(a){return a.status!=="resolved";});
  const list=(pending.length?pending:sorted).slice(0,6);
  const labels=${STATUS_LABEL};
  return s.jsxs("div",{className:"hx-notif-menu",onMouseEnter:enter,onMouseLeave:leave,children:[
    s.jsxs(Ft,{to:"/messages",className:"hx-notif-trigger","aria-haspopup":"true","aria-expanded":open?"true":"false",children:[
      props&&props.icon?props.icon:null,
      "通知",
      pending.length?s.jsx("span",{className:"hx-notif-count",children:pending.length>99?"99+":pending.length}):null
    ]}),
    open?s.jsxs("div",{className:"hx-notif-panel",role:"menu",children:[
      s.jsxs("header",{className:"hx-notif-panel__head",children:[
        s.jsx("strong",{children:"预警通知"}),
        s.jsxs("span",{children:["待处置 ",pending.length," 条 · 共 ",alerts.length," 条"]})
      ]}),
      s.jsx("div",{className:"hx-notif-panel__body",children:list.map(function(a){
        const patient=patients.find(function(x){return x.id===a.patientId;})||null;
        return s.jsxs(Ft,{to:"/patient/"+a.patientId,className:"hx-notif-item",role:"menuitem",onClick:function(){setOpen(false);},children:[
          s.jsx("span",{className:"hx-notif-item__flag "+(a.status==="resolved"?"is-done":"is-pending")}),
          s.jsxs("span",{className:"hx-notif-item__main",children:[
            s.jsx("strong",{children:a.title||"预警"}),
            s.jsxs("small",{children:[hxNotifPlace(patient),patient?" · "+patient.name:""]})
          ]}),
          s.jsxs("span",{className:"hx-notif-item__meta",children:[
            s.jsx("em",{children:labels[a.status]||a.status||"—"}),
            s.jsx("time",{children:hxNotifStamp(a.createdAt)})
          ]})
        ]},a.id);
      })}),
      !list.length?s.jsx("p",{className:"hx-notif-empty",children:"当前账号可见范围内暂无预警通知。"}):null,
      s.jsx(Ft,{to:"/messages",className:"hx-notif-more",onClick:function(){setOpen(false);},children:"查看全部通知 →"})
    ]}):null
  ]});
}
${BLOCK_END}
`

let js = fs.readFileSync(jsPath, 'utf8')
let removed = 0
const bs = js.indexOf(BLOCK_START)
if (bs >= 0) {
  const be = js.indexOf(BLOCK_END, bs)
  if (be < 0) {
    console.error('哨兵块不完整，终止。')
    process.exit(1)
  }
  js = js.slice(0, bs) + js.slice(be + BLOCK_END.length + 1)
  removed = 1
}
const anchor = js.indexOf(ANCHOR)
if (anchor < 0) {
  console.error('未找到 ' + ANCHOR + '，终止。')
  process.exit(1)
}
js = js.slice(0, anchor) + BLOCK + js.slice(anchor)

let wired = 0
if (js.includes(FOOTER_FROM)) {
  js = js.replace(FOOTER_FROM, FOOTER_TO)
  wired = 1
} else if (!js.includes(FOOTER_TO)) {
  console.error('底栏「通知」链接片段未找到，面板已插入但未接线。')
  process.exit(1)
}

fs.writeFileSync(jsPath, js)
console.log('notify menu patched: removed=' + removed + ' wired=' + wired + ' block=' + BLOCK.length + ' chars')
