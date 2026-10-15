/**
 * 远程会诊工作台
 *
 * 背景：默认入口 index.html 加载的是线上打包产物 index-BA_IO3dC.js，
 * 其 /#/consultations 页面用的是 scenario.json 的演示数据，按钮也没有绑定真实逻辑。
 *
 * 做法：在本路由下用真实后端接口渲染一个可用的会诊工作台，替换掉演示内容。
 *   - 会诊队列（接诊 / 进入远程会诊系统）
 *   - 发起会诊（选患者、目标医院科室、指定医生）
 *   - 可选接诊医生列表
 *
 * 三个踩过的坑，改这里前先看：
 * 1) 宿主节点挂在 document.body 上，不插进 <main class="workspace">。
 *    插进 React 管理的容器时，React 重渲染会把节点连同表单输入一起抹掉，
 *    现场表现是「body 上标记生效了、节点却不见了」。
 * 2) 请求不走 window.hxBackend。桥接把所有 GET 串行串在一条全局队列上，
 *    而后端单请求就要 2~3 秒，页面加载五个请求排队要十几秒、按钮点下去也要等很久。
 *    这里直接 fetch(apiBase()+'/v1'+path)。开发态路径是 /backend-api/v1，
 *    不匹配桥接拦截的 /api/v1 前缀，所以会落到原生 fetch，JWT 自己带上。
 * 3) 定位方式：宿主是 position:fixed，每次 tick 用 .workspace 的 rect 重算位置，
 *    页面还在启动页（没有 .workspace）时先隐藏。
 */
;(function () {
  var ROUTE = '/consultations'
  var HOST_ID = 'hx-cw'
  var STYLE_ID = 'hx-cw-style'
  var BODY_FLAG = 'hx-cw-active'

  var state = {
    ready: false,
    loading: false,
    busy: false,
    queue: [],
    doctors: [],
    patients: [],
    orgs: [],
    depts: [],
    msg: '',
    msgKind: '',
    schedule: null, // Date|null 定时开始时间
    qtab: 'wait',   // 队列状态 Tab：wait/incall/sched/done/all
    scopeTab: 'all', // 全县会诊 | 基层上转（#/consultations?tab=grassroots）
    dataSource: 'api', // api | demo
    dispatch: null, // {task,plate,complaint}|null 120 调度跳转带入的任务上下文
    scenarioBySession: {}, // sessionId -> scenario consultationRequest
    scenarioPatientByName: {}, // 姓名 -> patientId（API 队列缺 patientId 时补链）
  }

  /** 基层上转来源识别（与 grassroots-consult-enhance 一致） */
  var GRASSROOTS_SOURCE_HINTS = [
    '船石', '连界', '神界', '威远', '村卫生', '镇卫生', '新场镇', 'chuanshi', 'lianjie',
  ]

  // ---------- 基础工具 ----------

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  /** hash 里的查询参数（120 调度跳转带 task/plate/vehicle/complaint） */
  function query() {
    var raw = location.hash
    var i = raw.indexOf('?')
    return new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '')
  }

  function consultScopeTab() {
    var q = query()
    if (q.get('scope') === 'grassroots' || q.get('tab') === 'grassroots') return 'grassroots'
    return 'all'
  }

  function migrateLegacyGrassrootsUrl() {
    if (path() !== ROUTE) return
    var q = query()
    if (q.get('scope') !== 'grassroots') return
    var next = new URLSearchParams(q.toString())
    next.delete('scope')
    next.set('tab', 'grassroots')
    var qs = next.toString()
    location.replace(location.pathname + location.search + '#/consultations' + (qs ? '?' + qs : ''))
  }

  function isGrassrootsItem(it) {
    var src = [
      it.sourceHospital,
      it.sourceDepartment,
      it.sourceInstitutionId,
      it.source_hospital,
      it.source_department,
    ]
      .filter(Boolean)
      .join(' ')
    if (!src) return false
    return GRASSROOTS_SOURCE_HINTS.some(function (k) {
      return src.indexOf(k) >= 0
    })
  }

  function queueForScope() {
    if (state.scopeTab !== 'grassroots') return state.queue
    return state.queue.filter(isGrassrootsItem)
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function $(id) {
    return document.getElementById(id)
  }

  /** 列表响应可能被包一层，做兼容 */
  function listOf(data) {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.list)) return data.list
    if (data && Array.isArray(data.data)) return data.data
    return []
  }

  function uniqBy(rows, key) {
    var seen = {}
    return rows.filter(function (r) {
      var v = r[key]
      if (v == null || v === '' || seen[v]) return false
      seen[v] = 1
      return true
    })
  }

  function apiBase() {
    var cfg = window.HX_API_CONFIG
    if (cfg && cfg.base) return String(cfg.base).replace(/\/$/, '')
    return '/backend-api'
  }

  function jwt() {
    try {
      return sessionStorage.getItem('huaxi-jwt-token') || localStorage.getItem('huaxi-jwt-token') || ''
    } catch (e) {
      return ''
    }
  }

  /**
   * 直接请求 /api/v1，自带 JWT。
   *
   * 不走 window.hxBackend：桥接把所有 GET 串行串在一条队列上，本系统单请求就要 2~3 秒，
   * 页面加载时五个请求排队要十几秒，按钮点下去也要等很久。这里直接并发请求绕开队列。
   * 路径用 apiBase()+'/v1'，开发态是 /backend-api/v1，不匹配桥接的 /api/v1 拦截前缀，
   * 因而会走原生 fetch。
   */
  function request(method, pathname, query, body, retried) {
    var url = apiBase() + '/v1' + pathname
    if (query) {
      var qs = new URLSearchParams(query).toString()
      if (qs) url += '?' + qs
    }
    var headers = { Accept: 'application/json' }
    var token = jwt()
    if (token) headers.Authorization = 'Bearer ' + token
    var init = { method: method, headers: headers }
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    return fetch(url, init).then(function (res) {
      if (res.status === 401 && !retried) {
        var reauth = window.hxBackend && window.hxBackend.ensureAuth
          ? window.hxBackend.ensureAuth(true)
          : Promise.resolve(false)
        return Promise.resolve(reauth).then(function () {
          return request(method, pathname, query, body, true)
        })
      }
      return res.json().catch(function () {
        return {}
      }).then(function (json) {
        if (!res.ok || (json && json.code && json.code !== 200)) {
          throw new Error((json && json.message) || ('HTTP ' + res.status))
        }
        return json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json
      })
    })
  }

  function isNetworkError(e) {
    return /failed to fetch|networkerror|load failed|network request failed/i.test(String((e && e.message) || e))
  }

  /**
   * 网络级错误自动重试（最多 2 次，间隔递增）。
   * 开发态后端是单进程 PHP dev server，请求严格串行，并发稍多偶尔会掉连接，
   * 表现为浏览器抛 TypeError: Failed to fetch。
   */
  function call(method, pathname, query, body) {
    var attempt = 0
    function run() {
      return request(method, pathname, query, body, false).catch(function (e) {
        if (!isNetworkError(e) || attempt >= 2) throw e
        attempt += 1
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            run().then(resolve, reject)
          }, attempt === 1 ? 500 : 1200)
        })
      })
    }
    return run()
  }

  /** 限制并发的批量执行，避免一次性打满后端 */
  function mapLimited(items, limit, worker) {
    var results = new Array(items.length)
    var next = 0
    function run() {
      if (next >= items.length) return Promise.resolve()
      var i = next++
      return Promise.resolve(worker(items[i], i)).then(function (v) {
        results[i] = v
        return run()
      })
    }
    var runners = []
    for (var k = 0; k < Math.min(limit, items.length); k++) runners.push(run())
    return Promise.all(runners).then(function () {
      return results
    })
  }

  // ---------- 样式 ----------

  function ensureStyle() {
    if ($(STYLE_ID)) return
    var P = '.' + HOST_ID
    var style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = [
      // 宿主挂在 body 下，用固定定位覆盖工作区；原演示内容整体隐藏。
      // 盒子外观全部去掉（透明背景、无内边距），滚动条也不显示（滚轮仍可滚动）。
      'body.' + BODY_FLAG + ' .workspace > *{display:none !important}',
      '#' + HOST_ID + '{position:fixed;z-index:30;overflow:auto;background:transparent;padding:0;box-sizing:border-box;display:none;scrollbar-width:none}',
      '#' + HOST_ID + '::-webkit-scrollbar{display:none;width:0;height:0}',
      P + '-panel{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;margin-bottom:14px}',
      P + '-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}',
      P + '-head h2{margin:0;font-size:17px;font-weight:600;color:#1e293b}',
      P + '-actions{display:flex;gap:8px}',
      P + '-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:4px;padding:6px 12px;font-size:13px;cursor:pointer;font-family:inherit;line-height:1.4}',
      P + '-btn:hover:not(:disabled){border-color:#94a3b8;background:#f8fafc}',
      P + '-btn:disabled{opacity:.5;cursor:not-allowed}',
      P + '-btn.primary{background:#1d4ed8;border-color:#1d4ed8;color:#fff}',
      P + '-btn.primary:hover:not(:disabled){background:#1e40af}',
      P + '-btn.link{border:none;background:none;color:#1d4ed8;padding:2px 4px;text-decoration:none}',
      P + '-btn.link:hover{text-decoration:underline;background:none}',
      P + '-h3{font-size:14px;font-weight:600;color:#334155;margin:0 0 10px}',
      P + ' table{width:100%;border-collapse:collapse;font-size:13px}',
      P + ' th{background:#f1f5f9;color:#475569;font-weight:600;text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}',
      P + ' td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#1e293b;vertical-align:middle}',
      P + ' tr:last-child td{border-bottom:none}',
      P + '-tag{display:inline-block;padding:1px 7px;border-radius:3px;font-size:12px;border:1px solid transparent}',
      P + '-tag.waiting{background:#fef3c7;color:#92400e;border-color:#fde68a}',
      P + '-tag.calling{background:#dbeafe;color:#1e40af;border-color:#bfdbfe}',
      P + '-tag.finished{background:#f1f5f9;color:#64748b;border-color:#e2e8f0}',
      P + '-tag.sched{background:#ede9fe;color:#6d28d9;border-color:#ddd6fe}',
      // ---------- 队列状态 Tab ----------
      P + '-tabs{display:flex;gap:6px;margin:0 0 10px;flex-wrap:wrap}',
      P + '-tab{border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:999px;padding:3px 12px;font-size:12px;cursor:pointer;font-family:inherit;line-height:1.5}',
      P + '-tab:hover{border-color:#94a3b8;background:#f8fafc}',
      P + '-tab.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}',
      P + '-tab .n{opacity:.7;margin-left:3px}',
      P + '-scope{margin:0 0 14px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px}',
      P + '-scope-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}',
      P + '-scope-tab{display:inline-flex;align-items:center;min-height:32px;padding:5px 14px;font-size:13px;font-weight:600;color:#0369a1;text-decoration:none;background:#fff;border:1px solid #7dd3fc;border-radius:999px;cursor:pointer;font-family:inherit}',
      P + '-scope-tab:hover{background:#e0f2fe}',
      P + '-scope-tab.on{color:#fff;background:#0284c7;border-color:#0284c7}',
      P + '-scope-hint{margin:0;font-size:12px;line-height:1.55;color:#334155}',
      P + ' tr.' + HOST_ID + '-done td{opacity:.55}',
      // ---------- 120 调度带入的任务上下文条 ----------
      P + '-ctxstrip{display:flex;gap:8px;align-items:center;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;border-radius:4px;padding:6px 10px;font-size:12px;margin-bottom:10px}',
      P + '-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin-bottom:14px}',
      P + '-field{display:flex;flex-direction:column;gap:4px}',
      P + '-field label{font-size:12px;color:#64748b}',
      P + '-field input,' + P + '-field select,' + P + '-field textarea{font-family:inherit;font-size:13px;color:#1e293b;border:1px solid #cbd5e1;border-radius:4px;padding:6px 8px;background:#fff;width:100%;box-sizing:border-box}',
      P + '-field input:focus,' + P + '-field select:focus{outline:none;border-color:#1d4ed8}',
      // ---------- 定时选择器（自定义面板，替代原生 datetime-local） ----------
      P + '-dt{position:relative}',
      P + '-dt input{cursor:pointer;padding-right:52px}',
      P + '-dt input::placeholder{color:#94a3b8}',
      P + '-dt-clear{position:absolute;right:26px;top:50%;transform:translateY(-50%);width:16px;height:16px;line-height:14px;text-align:center;border-radius:50%;color:#94a3b8;font-size:13px;cursor:pointer;display:none}',
      P + '-dt-clear:hover{background:#f1f5f9;color:#475569}',
      P + '-dt-icon{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#94a3b8;display:flex;pointer-events:none}',
      P + '-dp{position:fixed;z-index:60;width:272px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 12px 32px rgba(15,23,42,.16);padding:10px;font-size:13px;user-select:none}',
      P + '-dp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}',
      P + '-dp-title{font-weight:600;color:#1e293b;font-size:13px}',
      P + '-dp-nav{border:none;background:none;cursor:pointer;color:#475569;width:24px;height:24px;border-radius:4px;font-size:14px;line-height:1}',
      P + '-dp-nav:hover{background:#f1f5f9}',
      P + '-dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}',
      P + '-wd{color:#94a3b8;font-size:11px;text-align:center;padding:2px 0}',
      P + '-day{border:none;background:none;cursor:pointer;height:26px;border-radius:4px;color:#1e293b;font-size:12px;font-family:inherit;padding:0}',
      P + '-day:hover{background:#f1f5f9}',
      P + '-day.dim{color:#cbd5e1}',
      P + '-day.today{box-shadow:inset 0 0 0 1px #94a3b8}',
      P + '-day.sel{background:#1d4ed8;color:#fff}',
      P + '-day.sel:hover{background:#1e40af}',
      P + '-day:disabled{color:#cbd5e1;cursor:not-allowed;background:none;box-shadow:none}',
      P + '-time{display:flex;gap:8px;align-items:center;margin-top:8px}',
      P + '-time b{font-size:12px;color:#64748b;font-weight:400;white-space:nowrap}',
      P + '-time select{flex:1;font-family:inherit;font-size:12px;color:#1e293b;border:1px solid #cbd5e1;border-radius:4px;padding:4px 6px;background:#fff;min-width:0}',
      P + '-foot{display:flex;gap:6px;align-items:center;margin-top:10px}',
      P + '-foot .sp{flex:1}',
      P + '-form-foot{grid-column:1/-1;display:flex;gap:8px;align-items:center}',
      P + '-msg{font-size:12px}',
      P + '-msg.err{color:#b91c1c}',
      P + '-msg.ok{color:#15803d}',
      P + '-msg.info{color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px 10px;margin-bottom:10px}',
      P + '-kind{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid transparent}',
      P + '-kind.grass{background:#ecfdf5;color:#047857;border-color:#6ee7b7}',
      P + '-kind.county{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}',
      P + '-kind.pre{background:#fff7ed;color:#c2410c;border-color:#fed7aa}',
      P + '-ops{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}',
      P + '-doctors-fold{margin-top:8px;font-size:13px;color:#64748b}',
      P + '-doctors-fold summary{cursor:pointer;font-weight:600;color:#475569}',
      P + '-doctors-fold[open] summary{margin-bottom:8px}',
      P + '-empty{color:#94a3b8;font-size:13px;padding:10px 2px}',
      '@media(max-width:900px){' + P + '-form{grid-template-columns:1fr}}',
    ].join('\n')
    document.head.appendChild(style)
  }

  // ---------- 模板 ----------

  function field(label, control) {
    return '<div class="' + HOST_ID + '-field"><label for="' + label + '">' + label + '</label>' + control + '</div>'
  }

  function options(list, valueOf, labelOf, placeholder) {
    var html = placeholder ? '<option value="">' + esc(placeholder) + '</option>' : ''
    html += list.map(function (it) {
      return '<option value="' + esc(valueOf(it)) + '">' + esc(labelOf(it)) + '</option>'
    }).join('')
    return html
  }

  function formHtml() {
    return (
      '<div class="' + HOST_ID + '-form">' +
      '<div class="' + HOST_ID + '-field"><label>患者</label><select id="hx-cw-f-patient"></select></div>' +
      '<div class="' + HOST_ID + '-field"><label>主诉</label><input id="hx-cw-f-complaint" type="text" placeholder="如：胸痛2小时"></div>' +
      '<div class="' + HOST_ID + '-field"><label>目标医院</label><select id="hx-cw-f-hospital"></select></div>' +
      '<div class="' + HOST_ID + '-field"><label>目标科室</label><select id="hx-cw-f-dept"></select></div>' +
      '<div class="' + HOST_ID + '-field"><label>指定接诊医生</label><select id="hx-cw-f-doctor"></select></div>' +
      '<div class="' + HOST_ID + '-field"><label>备注</label><input id="hx-cw-f-note" type="text" placeholder="选填"></div>' +
      '<div class="' + HOST_ID + '-field"><label>定时开始（选填）</label>' +
      '<div class="' + HOST_ID + '-dt">' +
      '<input id="hx-cw-f-schedule" type="text" readonly placeholder="选填 · 留空立即开始">' +
      '<span class="' + HOST_ID + '-dt-clear" id="hx-cw-f-dt-clear" data-act="dt-clear" title="清除定时">&times;</span>' +
      '<span class="' + HOST_ID + '-dt-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>' +
      '</div></div>' +
      '<div class="' + HOST_ID + '-form-foot">' +
      '<button type="button" class="' + HOST_ID + '-btn primary" data-act="submit">提交会诊</button>' +
      '<button type="button" class="' + HOST_ID + '-btn" data-act="toggle-form">取消</button>' +
      '<span class="' + HOST_ID + '-msg" id="hx-cw-form-msg"></span>' +
      '</div></div>'
    )
  }

  function shellHtml() {
    return (
      '<div class="' + HOST_ID + '-panel">' +
      '<div class="' + HOST_ID + '-head">' +
      '<h2 id="hx-cw-title">远程会诊</h2>' +
      '<div class="' + HOST_ID + '-actions">' +
      '<button type="button" class="' + HOST_ID + '-btn" data-act="refresh">刷新</button>' +
      '<button type="button" class="' + HOST_ID + '-btn primary" data-act="toggle-form">发起会诊</button>' +
      '</div></div>' +
      '<div id="hx-cw-scope"></div>' +
      '<div id="hx-cw-form-wrap" hidden>' + formHtml() + '</div>' +
      '<details class="' + HOST_ID + '-doctors-fold" id="hx-cw-doctors-fold">' +
      '<summary id="hx-cw-doctors-summary">可选接诊医生（发起会诊时在表单中指定）</summary>' +
      '<div id="hx-cw-doctors"></div></details>' +
      '<div id="hx-cw-ctx"></div>' +
      '<div class="' + HOST_ID + '-msg" id="hx-cw-msg"></div>' +
      '</div>' +
      '<div class="' + HOST_ID + '-panel">' +
      '<div class="' + HOST_ID + '-h3">会诊队列</div>' +
      '<div class="' + HOST_ID + '-tabs" id="hx-cw-tabs"></div>' +
      '<div id="hx-cw-queue"></div>' +
      '</div>'
    )
  }

  function statusTag(status, label) {
    var cls = status === 'WAITING' ? 'waiting' : status === 'IN_CALL' ? 'calling' : 'finished'
    return '<span class="' + HOST_ID + '-tag ' + cls + '">' + esc(label || status || '') + '</span>'
  }

  /** ISO 时间 → 浏览器本地时区的 "M月D日 HH:MM" */
  function fmtLocal(iso) {
    var d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    function p(n) { return (n < 10 ? '0' : '') + n }
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + p(d.getHours()) + ':' + p(d.getMinutes())
  }

  /** 定时会诊是否已到开始时间（按浏览器时钟算，到点即时翻转为可进入） */
  function startableNow(it) {
    return !it.scheduledAt || Date.now() >= new Date(it.scheduledAt).getTime()
  }

  // ---------- 定时选择器（自定义面板） ----------

  var dp = { open: false, view: null, sel: null, panel: null }

  function p2(n) {
    return (n < 10 ? '0' : '') + n
  }

  /** 同步输入框显示与清除按钮 */
  function updateDtInput() {
    var inp = $('hx-cw-f-schedule')
    if (inp) {
      var text = ''
      if (state.schedule) {
        var d = state.schedule
        var ymd = d.getFullYear() === new Date().getFullYear()
          ? (d.getMonth() + 1) + '月' + d.getDate() + '日'
          : d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
        text = ymd + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes())
      }
      inp.value = text
    }
    var clear = $('hx-cw-f-dt-clear')
    if (clear) clear.style.display = state.schedule ? 'block' : 'none'
  }

  function dpApply(d) {
    d.setSeconds(0, 0)
    state.schedule = new Date(d.getTime())
    updateDtInput()
    dpClose()
  }

  function dpClose() {
    // 防御性清理所有面板实例：dpBuild 重建时会先移除旧面板，
    // 但万一有历史残留（如异常路径未走 dpClose），一并清掉，杜绝僵尸面板
    var all = document.querySelectorAll('.' + HOST_ID + '-dp')
    for (var i = 0; i < all.length; i++) all[i].remove()
    dp.panel = null
    dp.open = false
  }

  /** 面板定位：贴到输入框下方，放不下则翻到上方；左右防出屏 */
  function dpPlace() {
    if (!dp.panel) return
    var inp = $('hx-cw-f-schedule')
    if (!inp) return dpClose()
    var r = inp.getBoundingClientRect()
    var pw = dp.panel.offsetWidth
    var ph = dp.panel.offsetHeight
    var left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8)
    var top = r.bottom + 6
    if (top + ph > window.innerHeight - 8 && r.top - ph - 6 > 8) top = r.top - ph - 6
    dp.panel.style.left = Math.round(left) + 'px'
    dp.panel.style.top = Math.round(top) + 'px'
  }

  function dpBuild() {
    // 先移除旧面板再重建：切月/选日都会走到这里，
    // 原来只 append 新面板不移除旧的，导致面板叠加、旧面板永远关不掉
    if (dp.panel) dp.panel.remove()
    var v = dp.view
    var y = v.getFullYear()
    var m = v.getMonth()
    var today = new Date()
    var today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

    var firstDow = new Date(y, m, 1).getDay()
    var days = new Date(y, m + 1, 0).getDate()
    var cells = ''
    for (var i = 0; i < firstDow; i++) cells += '<span></span>'
    for (var d = 1; d <= days; d++) {
      var dayEnd = new Date(y, m, d, 23, 59, 59).getTime()
      var dis = dayEnd < today0 ? ' disabled' : ''
      var cls = []
      var cur = new Date(y, m, d)
      if (today.getFullYear() === y && today.getMonth() === m && today.getDate() === d) cls.push('today')
      if (dp.sel && cur.getFullYear() === dp.sel.getFullYear() && cur.getMonth() === dp.sel.getMonth() && cur.getDate() === dp.sel.getDate()) cls.push('sel')
      cells += '<button type="button" class="' + HOST_ID + '-day' + (cls.length ? ' ' + cls.join(' ') : '') + '"' +
        dis + ' data-dp="day" data-d="' + d + '">' + d + '</button>'
    }

    var hh = dp.sel ? dp.sel.getHours() : Math.min(23, new Date().getHours())
    var mi = dp.sel ? dp.sel.getMinutes() : Math.ceil(new Date().getMinutes() / 5) * 5 % 60
    var hourOpts = ''
    for (var h = 0; h < 24; h++) hourOpts += '<option value="' + h + '"' + (h === hh ? ' selected' : '') + '>' + p2(h) + '时</option>'
    var minOpts = ''
    for (var mi2 = 0; mi2 < 60; mi2 += 5) {
      minOpts += '<option value="' + mi2 + '"' + (mi2 === (Math.round(mi / 5) * 5) % 60 ? ' selected' : '') + '>' + p2(mi2) + '分</option>'
    }

    var panel = document.createElement('div')
    panel.className = HOST_ID + '-dp'
    panel.innerHTML =
      '<div class="' + HOST_ID + '-dp-head">' +
      '<button type="button" class="' + HOST_ID + '-dp-nav" data-dp="prev">‹</button>' +
      '<span class="' + HOST_ID + '-dp-title">' + y + '年' + (m + 1) + '月</span>' +
      '<button type="button" class="' + HOST_ID + '-dp-nav" data-dp="next">›</button>' +
      '</div>' +
      '<div class="' + HOST_ID + '-dp-grid">' +
      ['日', '一', '二', '三', '四', '五', '六'].map(function (w) { return '<span class="' + HOST_ID + '-wd">' + w + '</span>' }).join('') +
      cells +
      '</div>' +
      '<div class="' + HOST_ID + '-time"><b>时间</b>' +
      '<select id="hx-cw-dp-h">' + hourOpts + '</select>' +
      '<select id="hx-cw-dp-m">' + minOpts + '</select>' +
      '</div>' +
      '<div class="' + HOST_ID + '-foot">' +
      '<button type="button" class="' + HOST_ID + '-btn" data-dp="p1h">1小时后</button>' +
      '<button type="button" class="' + HOST_ID + '-btn" data-dp="tom9">明天9:00</button>' +
      '<span class="sp"></span>' +
      '<button type="button" class="' + HOST_ID + '-btn" data-dp="clear">清除</button>' +
      '<button type="button" class="' + HOST_ID + '-btn primary" data-dp="ok">确定</button>' +
      '</div>'

    panel.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-dp]')
      if (!el || !panel.contains(el)) return
      var act = el.getAttribute('data-dp')
      if (act === 'prev' || act === 'next') {
        dp.view = new Date(y, m + (act === 'next' ? 1 : -1), 1)
        dpBuild()
        dpPlace()
      } else if (act === 'day') {
        var d = parseInt(el.getAttribute('data-d'), 10)
        var sh = parseInt(($('hx-cw-dp-h') || {}).value || '9', 10)
        var sm = parseInt(($('hx-cw-dp-m') || {}).value || '0', 10)
        dp.sel = new Date(y, m, d, sh, sm, 0, 0)
        dpBuild()
        dpPlace()
      } else if (act === 'p1h') {
        var t1 = new Date(Date.now() + 3600e3)
        dpApply(new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), t1.getHours(), t1.getMinutes(), 0, 0))
      } else if (act === 'tom9') {
        var t2 = new Date()
        dpApply(new Date(t2.getFullYear(), t2.getMonth(), t2.getDate() + 1, 9, 0, 0, 0))
      } else if (act === 'clear') {
        state.schedule = null
        updateDtInput()
        dpClose()
      } else if (act === 'ok') {
        if (dp.sel) dpApply(dp.sel)
        else dpClose()
      }
    })

    panel.addEventListener('change', function (ev) {
      var id = ev.target && ev.target.id
      if (id !== 'hx-cw-dp-h' && id !== 'hx-cw-dp-m') return
      var sh = parseInt(($('hx-cw-dp-h') || {}).value || '9', 10)
      var sm = parseInt(($('hx-cw-dp-m') || {}).value || '0', 10)
      if (dp.sel) dp.sel = new Date(dp.sel.getFullYear(), dp.sel.getMonth(), dp.sel.getDate(), sh, sm, 0, 0)
      else dp.sel = new Date(new Date().setHours(sh, sm, 0, 0))
    })

    dp.panel = panel
    document.body.appendChild(panel)
  }

  function dpOpen() {
    if (dp.open) return dpClose()
    dp.sel = state.schedule ? new Date(state.schedule.getTime()) : null
    dp.view = new Date()
    dp.view.setDate(1)
    dp.view.setHours(0, 0, 0, 0)
    dpBuild()
    dp.open = true
    dpPlace()
  }

  // 面板打开时的全局关闭与快捷键（只注册一次）
  if (!window.__hxCwDtBound) {
    window.__hxCwDtBound = true
    document.addEventListener('mousedown', function (ev) {
      if (!dp.open || !dp.panel) return
      var t = ev.target
      // 选择器面板在 body 上，触发框在宿主内：这两处都不要被外部 mousedown 关掉。
      // 原来写的是 '#hx-cw-f-dt'，但触发框是 class（hx-cw-dt）、输入框 id 是 hx-cw-f-schedule，
      // 这个选择器永远匹配不到，等于该保护没生效。
      if (dp.panel.contains(t) || (t.closest && t.closest('.' + HOST_ID + '-dt'))) return
      dpClose()
    })
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && dp.open) dpClose()
    })
  }

  function opBtn(act, id, text, primary) {
    return '<button type="button" class="' + HOST_ID + '-btn' + (primary ? ' primary' : ' link') +
      '" data-act="' + act + '" data-id="' + esc(id) + '">' + esc(text) + '</button>'
  }

  function opLink(href, text, primary) {
    return '<a class="' + HOST_ID + '-btn' + (primary ? ' primary' : ' link') + '" href="' + esc(href) + '">' + esc(text) + '</a>'
  }

  function resolvePatientId(it) {
    if (!it) return ''
    var pid = it.patientId || (it.patient && (it.patient.patientId || it.patient.id)) || ''
    if (pid) return pid
    var name = (it.patient && it.patient.name) || it.patientName || ''
    if (name && state.scenarioPatientByName[name.trim()]) return state.scenarioPatientByName[name.trim()]
    if (!name || !state.patients.length) return ''
    var hit = state.patients.filter(function (p) { return p.name === name })[0]
    return (hit && hit.patientId) || ''
  }

  /** 本系统内会诊室 hash（优先 token，否则 sessionId） */
  function roomHref(it) {
    if (!it) return ''
    var token = it.consultationToken || it.token || it.rtcToken || it.roomToken || ''
    if (!token && it.sessionId && state.scenarioBySession[it.sessionId]) {
      token = state.scenarioBySession[it.sessionId].token || ''
    }
    var id = token || it.sessionId || ''
    return id ? '/#/room/' + encodeURIComponent(id) : ''
  }

  function ingestScenarioPack(pack) {
    if (!pack) return
    var st = (pack && pack.state) || pack || {}
    state.scenarioBySession = {}
    state.scenarioPatientByName = {}
    ;(st.consultationRequests || []).forEach(function (cr) {
      if (cr && cr.id) state.scenarioBySession[cr.id] = cr
    })
    ;(st.patients || []).forEach(function (p) {
      if (p && p.name && p.id) state.scenarioPatientByName[String(p.name).trim()] = p.id
    })
    state.queue = state.queue.map(function (it) {
      var cr = state.scenarioBySession[it.sessionId]
      if (cr) {
        if (!it.consultationToken && cr.token) it.consultationToken = cr.token
        if (!it.patientId && cr.patientId) it.patientId = cr.patientId
      }
      if (!it.patientId) it.patientId = resolvePatientId(it)
      return it
    })
    if (!state.patients.length) {
      state.patients = (st.patients || []).map(function (p) {
        return {
          patientId: p.id,
          name: p.name,
          gender: p.gender,
          age: p.age,
          institutionName: orgLabel(p.institutionId),
          departmentName: p.departmentId || '',
          chiefComplaint: (p.symptoms || []).join('、'),
        }
      })
    }
    if (!state.doctors.length) {
      state.doctors = (st.staff || [])
        .filter(function (s) { return String(s.profession || '').toLowerCase() === 'doctor' })
        .map(function (s) {
          return {
            doctorId: s.id,
            name: s.name,
            institutionName: orgLabel(s.institutionId),
            departmentName: s.departmentId || '',
          }
        })
    }
  }

  function fetchScenarioPack() {
    return fetch('/scenario.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null })
      .catch(function () { return null })
  }

  function consultKind(it) {
    if (isGrassrootsItem(it)) return { label: '基层上转', cls: 'grass' }
    var src = String(it.sourceHospital || '') + String(it.sourceDepartment || '')
    if (/120|出警|院前|急救/.test(src)) return { label: '院前', cls: 'pre' }
    return { label: '县域', cls: 'county' }
  }

  var ORG_LABEL = {
    chuanshi: '船石村卫生室',
    lianjie: '连界镇卫生院',
    weiyuan: '威远县人民医院',
    huaxi: '四川大学华西医院',
    'neijiang-first': '内江市第一人民医院',
  }

  function orgLabel(id) {
    return ORG_LABEL[id] || id || '—'
  }

  // ---------- 队列状态 Tab ----------

  var QTABS = [
    { k: 'wait', label: '待接诊' },
    { k: 'incall', label: '会诊中' },
    { k: 'sched', label: '定时' },
    { k: 'done', label: '已结束' },
    { k: 'all', label: '全部' },
  ]

  /** 单条会诊单归属哪个 Tab（定时未到点的 WAITING 单归"定时"，其余 WAITING 归"待接诊"） */
  function qtabMatch(it, k) {
    switch (k) {
      case 'wait': return it.status === 'WAITING' && startableNow(it)
      case 'incall': return it.status === 'IN_CALL'
      case 'sched': return it.status !== 'FINISHED' && !!it.scheduledAt && !startableNow(it)
      case 'done': return it.status === 'FINISHED'
      default: return true
    }
  }

  function scopeHtml() {
    var tab = state.scopeTab
    var hint =
      tab === 'grassroots'
        ? '仅显示乡镇、村卫生室及县域上转来源的会诊单；与「全县会诊」同一队列，按来源筛选。'
        : '全县会诊队列（院前、县域、上级医院）；基层发起的上转请切到「基层上转」。'
    return (
      '<div class="' + HOST_ID + '-scope">' +
      '<nav class="' + HOST_ID + '-scope-tabs" aria-label="会诊范围">' +
      '<button type="button" class="' + HOST_ID + '-scope-tab' + (tab === 'all' ? ' on' : '') +
      '" data-act="scope" data-scope="all">全县会诊</button>' +
      '<button type="button" class="' + HOST_ID + '-scope-tab' + (tab === 'grassroots' ? ' on' : '') +
      '" data-act="scope" data-scope="grassroots">基层上转</button>' +
      '</nav><p class="' + HOST_ID + '-scope-hint">' + hint + '</p></div>'
    )
  }

  function tabsHtml() {
    var base = queueForScope()
    return QTABS.map(function (t) {
      var n = 0
      base.forEach(function (it) { if (qtabMatch(it, t.k)) n++ })
      return '<button type="button" class="' + HOST_ID + '-tab' + (state.qtab === t.k ? ' on' : '') +
        '" data-act="qtab" data-qtab="' + t.k + '">' + t.label + '<span class="n">' + n + '</span></button>'
    }).join('')
  }

  function queueHtml() {
    var scoped = queueForScope()
    var rows0 = scoped.filter(function (it) { return qtabMatch(it, state.qtab) })
    if (state.loading && !state.queue.length) return '<div class="' + HOST_ID + '-empty">加载中…</div>'
    if (!rows0.length) {
      if (state.scopeTab === 'grassroots' && state.queue.length) {
        return '<div class="' + HOST_ID + '-empty">当前筛选下暂无基层上转会诊单（全县共 ' + state.queue.length + ' 条）</div>'
      }
      return '<div class="' + HOST_ID + '-empty">' + (scoped.length ? '该状态下暂无会诊单' : '暂无会诊单') + '</div>'
    }
    var rows = rows0.map(function (it) {
      var p = it.patient || {}
      var who = esc(p.name || '—')
      if (p.age) who += ' · ' + esc(p.age) + '岁'
      var ops = []
      var scheduledLater = it.scheduledAt && !startableNow(it)
      // 定时未到点：状态列显示"定时·开始时间"，不出现"进入会诊室"
      if (!scheduledLater && it.status === 'WAITING' && state.dataSource === 'api') {
        ops.push(opBtn('accept', it.sessionId, '接诊'))
      }
      if (!scheduledLater && (it.status === 'WAITING' || it.status === 'IN_CALL')) {
        var rh = roomHref(it)
        if (rh) ops.push(opLink(rh, '进入会诊室', it.status === 'IN_CALL'))
        else ops.push(opBtn('join', it.sessionId, '进入会诊室', it.status === 'IN_CALL'))
      }
      var statusHtml = scheduledLater
        ? '<span class="' + HOST_ID + '-tag sched">定时 · ' + esc(fmtLocal(it.scheduledAt)) + ' 开始</span>'
        : statusTag(it.status, it.statusLabel)
      var kind = consultKind(it)
      var pid = resolvePatientId(it)
      if (pid) {
        ops.push(opLink('/#/patient/' + encodeURIComponent(pid), '患者档案'))
        ops.push(opLink('/#/transfers?scope=grassroots&patient=' + encodeURIComponent(pid), '转诊协同'))
      }
      var cc = it.chiefComplaint || (p.chiefComplaint || '') || '—'
      var done = it.status === 'FINISHED'
      return (
        '<tr' + (done ? ' class="' + HOST_ID + '-done"' : '') + '>' +
        '<td><span class="' + HOST_ID + '-kind ' + kind.cls + '">' + esc(kind.label) + '</span><br>' +
        '<span style="color:#64748b;font-size:12px">' + esc(it.consultCode || it.sessionId) + '</span></td>' +
        '<td>' + who + '</td>' +
        '<td>' + esc(it.sourceHospital || '—') + '<br><span style="color:#94a3b8">' + esc(it.sourceDepartment || '') + '</span></td>' +
        '<td>' + esc(it.targetHospital || '—') + '<br><span style="color:#94a3b8">' + esc(it.targetDepartment || '') + '</span></td>' +
        '<td style="max-width:140px">' + esc(cc) + '</td>' +
        '<td>' + statusHtml + '</td>' +
        '<td><div class="' + HOST_ID + '-ops">' + (ops.length ? ops.join('') : '<span style="color:#94a3b8">—</span>') + '</div></td>' +
        '</tr>'
      )
    }).join('')
    return (
      '<table><thead><tr>' +
      '<th>类型 / 单号</th><th>患者</th><th>来源</th><th>目标</th><th>主诉</th><th>状态</th><th>操作</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>'
    )
  }

  function doctorsHtml() {
    if (!state.doctors.length) return '<div class="' + HOST_ID + '-empty">暂无医生</div>'
    var rows = state.doctors.map(function (d) {
      return (
        '<tr>' +
        '<td>' + esc(d.name || '—') + '</td>' +
        '<td>' + esc(d.institutionName || '—') + '</td>' +
        '<td>' + esc(d.departmentName || '—') + '</td>' +
        '</tr>'
      )
    }).join('')
    return (
      '<table><thead><tr><th>姓名</th><th>所属机构</th><th>科室</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>'
    )
  }

  /** 同步 120 调度跳转带入的任务上下文（task/plate/complaint），变化才重绘 */
  function syncDispatchFromQuery() {
    var q = query()
    var task = q.get('task') || ''
    var plate = q.get('plate') || ''
    var complaint = q.get('complaint') || ''
    var next = (task || plate) ? { task: task, plate: plate, complaint: complaint } : null
    var prev = state.dispatch
    var changed = (!!prev !== !!next) ||
      (prev && next && (prev.task !== next.task || prev.plate !== next.plate || prev.complaint !== next.complaint))
    if (changed) {
      state.dispatch = next
      paint()
    }
  }

  function syncScopeFromQuery() {
    var next = consultScopeTab()
    if (state.scopeTab === next) return
    state.scopeTab = next
    paint()
  }

  function paint() {
    var q = $('hx-cw-queue')
    var d = $('hx-cw-doctors')
    var tb = $('hx-cw-tabs')
    var ctx = $('hx-cw-ctx')
    var scope = $('hx-cw-scope')
    var title = $('hx-cw-title')
    if (scope) scope.innerHTML = scopeHtml()
    if (title) {
      title.textContent = state.scopeTab === 'grassroots' ? '远程会诊 · 基层上转' : '远程会诊'
    }
    if (q) q.innerHTML = queueHtml()
    if (d) d.innerHTML = doctorsHtml()
    var dsum = $('hx-cw-doctors-summary')
    if (dsum) {
      dsum.textContent =
        '可选接诊医生（' + (state.doctors.length || 0) + ' 人 · 发起会诊时在表单中指定）'
    }
    if (tb) tb.innerHTML = tabsHtml()
    if (ctx) {
      var dd = state.dispatch
      ctx.innerHTML = dd
        ? '<div class="' + HOST_ID + '-ctxstrip">任务上下文：任务 ' + esc(dd.task || '—') +
          ' · ' + esc(dd.plate || '—') + (dd.complaint ? ' · 主诉 ' + esc(dd.complaint) : '') + '</div>'
        : ''
    }
    syncForm()
  }

  function fillSelect(el, html) {
    if (!el) return
    var keep = el.value
    el.innerHTML = html
    if (keep) {
      for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].value === keep) {
          el.selectedIndex = i
          break
        }
      }
    }
  }

  function syncForm() {
    fillSelect($('hx-cw-f-patient'), options(state.patients, function (p) {
      return p.patientId
    }, function (p) {
      var who = (p.name || '—') + '（' + (p.genderLabel || '') + (p.age ? ' ' + p.age + '岁' : '')
      if (p.institutionName) who += ' · ' + p.institutionName
      return who + '）'
    }, '请选择患者'))

    fillSelect($('hx-cw-f-hospital'), options(state.orgs, function (o) {
      return o.name
    }, function (o) {
      return o.name
    }, '请选择目标医院'))

    fillSelect($('hx-cw-f-dept'), options(state.depts, function (d) {
      return d.dept_name
    }, function (d) {
      return d.dept_name
    }, '请选择目标科室'))

    fillSelect($('hx-cw-f-doctor'), options(state.doctors, function (d) {
      return d.doctorId
    }, function (d) {
      return d.name + (d.departmentName ? '（' + d.departmentName + '）' : '')
    }, '不指定'))
  }

  function setMsg(text, kind) {
    state.msg = text || ''
    state.msgKind = kind || ''
    var el = $('hx-cw-msg')
    if (!el) return
    var cls = HOST_ID + '-msg'
    if (kind === 'err') cls += ' err'
    else if (kind === 'ok') cls += ' ok'
    else if (kind === 'info') cls += ' info'
    el.className = cls
    el.textContent = state.msg
  }

  function setFormMsg(text, kind) {
    var el = $('hx-cw-form-msg')
    if (!el) return
    el.className = HOST_ID + '-msg ' + (kind || '')
    el.textContent = text || ''
  }

  // ---------- 数据 ----------

  function mapScenarioConsult(cr, pack) {
    var patients = pack.patients || []
    var staff = pack.staff || []
    var p = patients.filter(function (x) { return x.id === cr.patientId })[0] || {}
    var st = cr.status === 'completed' ? 'FINISHED' : cr.status === 'accepted' ? 'IN_CALL' : 'WAITING'
    var nom = staff.filter(function (s) { return s.id === cr.nominatedDoctorId })[0]
    return {
      sessionId: cr.id,
      consultCode: cr.id,
      consultationToken: cr.token,
      token: cr.token,
      patientId: cr.patientId,
      status: st,
      sourceHospital: orgLabel(cr.sourceInstitutionId),
      sourceDepartment: cr.sourceDepartmentId || '',
      targetHospital: orgLabel(cr.institutionId),
      targetDepartment: cr.departmentId || '',
      nominatedDoctorName: nom ? nom.name : '',
      chiefComplaint: (p.symptoms && p.symptoms.join && p.symptoms.join('、')) || '',
      patient: { name: p.name, age: p.age, patientId: p.id, chiefComplaint: (p.symptoms || []).join('、') },
    }
  }

  function loadDemoScenario() {
    return fetch('/scenario.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (pack) {
        var st = (pack && pack.state) || pack || {}
        var reqs = st.consultationRequests || []
        state.queue = reqs.map(function (cr) { return mapScenarioConsult(cr, st) })
        state.patients = (st.patients || []).map(function (p) {
          return {
            patientId: p.id,
            name: p.name,
            gender: p.gender,
            age: p.age,
            institutionName: orgLabel(p.institutionId),
            departmentName: p.departmentId || '',
            chiefComplaint: (p.symptoms || []).join('、'),
          }
        })
        state.doctors = (st.staff || [])
          .filter(function (s) { return String(s.profession || '').toLowerCase() === 'doctor' })
          .map(function (s) {
            return {
              doctorId: s.id,
              name: s.name,
              institutionName: orgLabel(s.institutionId),
              departmentName: s.departmentId || '',
            }
          })
        state.orgs = []
        state.depts = []
        state.dataSource = 'demo'
        ingestScenarioPack(pack)
        state.ready = true
        return state.queue.length > 0
      })
      .catch(function () {
        return false
      })
  }

  function loadAll() {
    if (state.loading) return Promise.resolve()
    state.loading = true
    paint()
    var t = Date.now()
    var tasks = [
      ['/consultations', { status: 'WAITING,IN_CALL,FINISHED', pageNum: 1, pageSize: 50, _t: t }],
      ['/consultations/doctors', { _t: t }],
      ['/patients', { pageNum: 1, pageSize: 200, _t: t }],
      ['/organizations', { _t: t }],
      ['/departments', { _t: t }],
    ]
    return mapLimited(tasks, 2, function (task) {
      return call('GET', task[0], task[1]).catch(function () { return null })
    }).then(function (res) {
      var queueRaw = res[0]
      if (queueRaw) {
        state.queue = listOf(queueRaw)
        state.dataSource = 'api'
        if (res[1] && res[1].doctors) state.doctors = res[1].doctors
        if (res[2]) state.patients = listOf(res[2])
        if (res[3]) state.orgs = listOf(res[3])
        if (res[4]) state.depts = uniqBy(listOf(res[4]), 'dept_name')
        state.ready = true
        setMsg('')
        return fetchScenarioPack().then(function (pack) {
          ingestScenarioPack(pack)
        })
      }
      return loadDemoScenario().then(function (ok) {
        if (ok) {
          setMsg('后端会诊接口未连接，当前为演示队列；接诊/发起会诊接后端后自动切换。', 'info')
        } else {
          setMsg('无法加载会诊数据，请检查网络或刷新页面。', 'err')
        }
      })
    }).catch(function () {
      return loadDemoScenario().then(function (ok) {
        if (ok) setMsg('后端会诊接口未连接，当前为演示队列。', 'info')
        else setMsg('无法加载会诊数据。', 'err')
      })
    }).then(function () {
      state.loading = false
      paint()
      if (!state.ready && !state.queue.length) unmount()
    })
  }

  /** 同步右上角按钮文案：表单展开时是"收起表单"，避免两个入口互相冲突 */
  function setHeadBtn(open) {
    var btn = document.querySelector('#' + HOST_ID + ' .' + HOST_ID + '-actions [data-act="toggle-form"]')
    if (btn) btn.textContent = open ? '收起表单' : '发起会诊'
  }

  function toggleForm() {
    var wrap = $('hx-cw-form-wrap')
    if (!wrap) return
    wrap.hidden = !wrap.hidden
    if (!wrap.hidden) {
      syncForm()
      // 120 调度带入的任务上下文预填：主诉、备注（不覆盖医生已输入的内容）
      var dd = state.dispatch
      if (dd) {
        var c = $('hx-cw-f-complaint')
        if (c && !c.value && dd.complaint) c.value = dd.complaint
        var n = $('hx-cw-f-note')
        if (n && !n.value && (dd.task || dd.plate)) {
          n.value = ('任务 ' + (dd.task || '—') + ' · ' + dd.plate).replace(/^任务 — · $/, '').trim()
        }
      }
      setFormMsg('')
    }
    setHeadBtn(!wrap.hidden)
  }

  function submitForm() {
    if (state.busy) return setFormMsg('上一步操作还在进行，请稍候', 'err')
    if (state.dataSource === 'demo') {
      return setFormMsg('演示队列：请从「患者登记/急救事件」发起会诊，或连接后端后在此提交。', 'err')
    }
    var pid = ($('hx-cw-f-patient') || {}).value || ''
    var hospital = ($('hx-cw-f-hospital') || {}).value || ''
    var dept = ($('hx-cw-f-dept') || {}).value || ''
    if (!pid) return setFormMsg('请选择患者', 'err')
    if (!hospital || !dept) return setFormMsg('请选择目标医院与科室', 'err')

    var patient = state.patients.filter(function (p) {
      return p.patientId === pid
    })[0] || {}

    // 定时开始：选择器产出的本地时间转带时区 ISO 发给后端
    // （应用后端时区为 UTC，裸时间会被按 UTC 解释而偏差 8 小时）
    var scheduledAt = null
    if (state.schedule) {
      if (!(state.schedule instanceof Date) || isNaN(state.schedule.getTime())) {
        return setFormMsg('定时开始时间无效', 'err')
      }
      if (state.schedule.getTime() <= Date.now()) {
        return setFormMsg('定时开始时间必须晚于当前时间', 'err')
      }
      scheduledAt = state.schedule.toISOString()
    }

    state.busy = true
    setFormMsg('提交中…')
    call('POST', '/consultations', null, {
      patientId: pid,
      patientName: patient.name || '',
      gender: patient.gender || '',
      age: patient.age || 0,
      chiefComplaint: ($('hx-cw-f-complaint') || {}).value || '',
      sourceHospital: patient.institutionName || '',
      sourceDepartment: patient.departmentName || '',
      targetHospital: hospital,
      targetDepartment: dept,
      nominatedDoctorId: ($('hx-cw-f-doctor') || {}).value || null,
      note: ($('hx-cw-f-note') || {}).value || '',
      scheduledAt: scheduledAt,
    }).then(function (data) {
      setFormMsg('')
      $('hx-cw-form-wrap').hidden = true
      setHeadBtn(false)
      state.schedule = null
      updateDtInput()
      dpClose()
      var code = (data && data.consultCode) || ''
      // 切到新单所在的 Tab，避免用户停在"已结束"看不到刚发起的会诊
      if (data && data.scheduledAt && !data.startable) {
        state.qtab = 'sched'
        setMsg('会诊已定时：' + code + '，' + fmtLocal(data.scheduledAt) + ' 开始，到点后可在队列点击进入会诊室', 'ok')
      } else {
        state.qtab = 'wait'
        setMsg('会诊已发起' + (code ? '：' + code : '') +
          (data && data.rtcReady ? '，已接入远程会诊系统' : '，音视频服务未就绪，已生成会诊单'), data && data.rtcReady ? 'ok' : '')
      }
      return loadAll()
    }).catch(function (e) {
      setFormMsg((e && e.message) || '发起失败', 'err')
    }).then(function () {
      state.busy = false
    })
  }

  function accept(sessionId) {
    if (state.dataSource === 'demo') {
      setMsg('演示队列：请点「进入会诊室」或「患者档案」；接后端后「接诊」将写入真实会诊单。', 'info')
      return
    }
    if (state.busy) return setMsg('上一步操作还在进行，请稍候', 'err')
    state.busy = true
    setMsg('接诊中…')
    call('POST', '/consultations/' + encodeURIComponent(sessionId) + '/accept', null, {})
      .then(function (data) {
        setMsg('已接诊：' + ((data && data.acceptedByName) || ''), 'ok')
        return loadAll()
      })
      .catch(function (e) {
        setMsg((e && e.message) || '接诊失败', 'err')
      })
      .then(function () {
        state.busy = false
      })
  }

  function enterRoom(sessionId) {
    var it = state.queue.filter(function (x) { return x.sessionId === sessionId })[0]
    var rh = roomHref(it || { sessionId: sessionId })
    if (rh) {
      location.hash = rh.replace(/^\/#/, '#')
      setMsg('')
      return
    }
    if (state.busy) return setMsg('上一步操作还在进行，请稍候', 'err')
    state.busy = true
    setMsg('正在获取入会链接…')
    call('GET', '/consultations/' + encodeURIComponent(sessionId) + '/join-link', { _t: Date.now() })
      .then(function (link) {
        var url = link && link.joinUrl
        if (!url) throw new Error('未获取到入会链接')
        setMsg('')
        window.open(url, '_blank', 'noopener')
      })
      .catch(function () {
        location.hash = '#/room/' + encodeURIComponent(sessionId)
        setMsg('已打开本系统会诊室；外接 RTC 未就绪时将显示演示画面。', 'info')
      })
      .then(function () {
        state.busy = false
      })
  }

  // ---------- 宿主节点 ----------

  function bind(root) {
    if (root.dataset.hxCwBound === '1') return
    root.dataset.hxCwBound = '1'
    root.addEventListener('click', function (ev) {
      if (ev.target && ev.target.id === 'hx-cw-f-schedule') {
        dpOpen()
        return
      }
      var btn = ev.target.closest('[data-act]')
      if (!btn || !root.contains(btn)) return
      var act = btn.getAttribute('data-act')
      var id = btn.getAttribute('data-id')
      if (act === 'refresh') {
        setMsg('')
        loadAll()
      } else if (act === 'toggle-form') toggleForm()
      else if (act === 'submit') submitForm()
      else if (act === 'accept') accept(id)
      else if (act === 'join') enterRoom(id)
      else if (act === 'qtab') {
        state.qtab = btn.getAttribute('data-qtab') || 'all'
        paint()
      }
      else if (act === 'scope') {
        var sc = btn.getAttribute('data-scope') || 'all'
        var qs = sc === 'grassroots' ? '?tab=grassroots' : ''
        location.hash = '#/consultations' + qs
      }
      else if (act === 'dt-clear') {
        state.schedule = null
        updateDtInput()
        dpClose()
      }
    })
    root.addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'hx-cw-f-patient') {
        var p = state.patients.filter(function (x) {
          return x.patientId === ev.target.value
        })[0]
        var box = $('hx-cw-f-complaint')
        if (p && box && !box.value) box.value = p.chiefComplaint || ''
      }
    })
  }

  /**
   * 让宿主节点贴在 .workspace 的位置上（固定定位，随窗口与布局变化重算）。
   * 高度钳制到视口内：超出部分靠宿主内部滚动（滚动条已隐藏），页面级不再出现滚动条。
   */
  function place(host) {
    var ws = document.querySelector('.workspace')
    if (!ws) {
      host.style.display = 'none'
      return
    }
    var r = ws.getBoundingClientRect()
    if (r.width < 40 || r.height < 40) {
      host.style.display = 'none'
      return
    }
    var top = Math.max(0, Math.round(r.top))
    var avail = window.innerHeight - top - 8
    host.style.display = 'block'
    host.style.top = top + 'px'
    host.style.left = Math.round(r.left) + 'px'
    host.style.width = Math.round(r.width) + 'px'
    host.style.height = Math.max(160, Math.min(Math.round(r.height), avail)) + 'px'
  }

  function unmount() {
    document.body.classList.remove(BODY_FLAG)
    var el = $(HOST_ID)
    if (el) el.remove()
    dpClose()
    state.ready = false
  }

  function tick() {
    if (path() !== ROUTE) {
      if ($(HOST_ID) || document.body.classList.contains(BODY_FLAG)) unmount()
      return
    }
    ensureStyle()
    if (!document.body.classList.contains(BODY_FLAG)) document.body.classList.add(BODY_FLAG)
    migrateLegacyGrassrootsUrl()
    state.scopeTab = consultScopeTab()
    syncDispatchFromQuery()
    syncScopeFromQuery()

    var host = $(HOST_ID)
    if (!host) {
      host = document.createElement('section')
      host.id = HOST_ID
      host.innerHTML = shellHtml()
      document.body.appendChild(host)
      bind(host)
      setMsg(state.msg, state.msgKind)
      paint()
    }
    place(host)
    if (!state.ready && !state.loading) loadAll()
  }

  window.addEventListener('hashchange', migrateLegacyGrassrootsUrl)
  window.hxEnhance(tick, { wait: 300, observeRoot: true, afterNav: 120 })
  // 兜底：布局变化（窗口缩放、字体加载、侧栏展开）时重算位置，并保证节点不丢
  setInterval(tick, 900)
  window.addEventListener('resize', tick)
  // 定时会诊到点自动翻转：本地时钟越过开始时间后，把"定时未开始"行刷成可进入
  // （只更新本地状态并重绘，不重新请求；改完 startable 计数归零即停）
  setInterval(function () {
    if (!state.ready || !state.queue.length) return
    var flipped = false
    state.queue.forEach(function (it) {
      if (it.scheduledAt && !it.startable && startableNow(it)) {
        it.startable = true
        flipped = true
      }
    })
    if (flipped) paint()
  }, 15000)
})()
