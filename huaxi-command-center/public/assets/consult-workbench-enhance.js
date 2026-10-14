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
  }

  // ---------- 基础工具 ----------

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
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
      P + '-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin-bottom:14px}',
      P + '-field{display:flex;flex-direction:column;gap:4px}',
      P + '-field label{font-size:12px;color:#64748b}',
      P + '-field input,' + P + '-field select,' + P + '-field textarea{font-family:inherit;font-size:13px;color:#1e293b;border:1px solid #cbd5e1;border-radius:4px;padding:6px 8px;background:#fff;width:100%;box-sizing:border-box}',
      P + '-field input:focus,' + P + '-field select:focus{outline:none;border-color:#1d4ed8}',
      P + '-form-foot{grid-column:1/-1;display:flex;gap:8px;align-items:center}',
      P + '-msg{font-size:12px}',
      P + '-msg.err{color:#b91c1c}',
      P + '-msg.ok{color:#15803d}',
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
      '<h2>远程会诊</h2>' +
      '<div class="' + HOST_ID + '-actions">' +
      '<button type="button" class="' + HOST_ID + '-btn" data-act="refresh">刷新</button>' +
      '<button type="button" class="' + HOST_ID + '-btn primary" data-act="toggle-form">发起会诊</button>' +
      '</div></div>' +
      '<div id="hx-cw-form-wrap" hidden>' + formHtml() + '</div>' +
      '<div class="' + HOST_ID + '-msg" id="hx-cw-msg"></div>' +
      '</div>' +
      '<div class="' + HOST_ID + '-panel">' +
      '<div class="' + HOST_ID + '-h3">会诊队列</div>' +
      '<div id="hx-cw-queue"></div>' +
      '</div>' +
      '<div class="' + HOST_ID + '-panel">' +
      '<div class="' + HOST_ID + '-h3">可选接诊医生</div>' +
      '<div id="hx-cw-doctors"></div>' +
      '</div>'
    )
  }

  function statusTag(status, label) {
    var cls = status === 'WAITING' ? 'waiting' : status === 'IN_CALL' ? 'calling' : 'finished'
    return '<span class="' + HOST_ID + '-tag ' + cls + '">' + esc(label || status || '') + '</span>'
  }

  function opBtn(act, id, text, primary) {
    return '<button type="button" class="' + HOST_ID + '-btn' + (primary ? ' primary' : ' link') +
      '" data-act="' + act + '" data-id="' + esc(id) + '">' + esc(text) + '</button>'
  }

  function queueHtml() {
    if (state.loading && !state.queue.length) return '<div class="' + HOST_ID + '-empty">加载中…</div>'
    if (!state.queue.length) return '<div class="' + HOST_ID + '-empty">暂无会诊单</div>'
    var rows = state.queue.map(function (it) {
      var p = it.patient || {}
      var who = esc(p.name || '—')
      if (p.age) who += ' · ' + esc(p.age) + '岁'
      var ops = []
      if (it.status === 'WAITING') ops.push(opBtn('accept', it.sessionId, '接诊'))
      if (it.status === 'WAITING' || it.status === 'IN_CALL') {
        ops.push(opBtn('join', it.sessionId, '进入会诊室', it.status === 'IN_CALL'))
      }
      return (
        '<tr>' +
        '<td>' + esc(it.consultCode || it.sessionId) + '</td>' +
        '<td>' + who + '</td>' +
        '<td>' + esc(it.sourceHospital || '—') + '<br><span style="color:#94a3b8">' + esc(it.sourceDepartment || '') + '</span></td>' +
        '<td>' + esc(it.targetHospital || '—') + '<br><span style="color:#94a3b8">' + esc(it.targetDepartment || '') + '</span></td>' +
        '<td>' + esc(it.nominatedDoctorName || '—') + '</td>' +
        '<td>' + statusTag(it.status, it.statusLabel) + '</td>' +
        '<td>' + (ops.length ? ops.join(' ') : '<span style="color:#94a3b8">—</span>') + '</td>' +
        '</tr>'
      )
    }).join('')
    return (
      '<table><thead><tr>' +
      '<th>会诊单号</th><th>患者</th><th>来源</th><th>目标</th><th>指定医生</th><th>状态</th><th>操作</th>' +
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

  function paint() {
    var q = $('hx-cw-queue')
    var d = $('hx-cw-doctors')
    if (q) q.innerHTML = queueHtml()
    if (d) d.innerHTML = doctorsHtml()
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
    el.className = HOST_ID + '-msg ' + (kind || '')
    el.textContent = state.msg
  }

  function setFormMsg(text, kind) {
    var el = $('hx-cw-form-msg')
    if (!el) return
    el.className = HOST_ID + '-msg ' + (kind || '')
    el.textContent = text || ''
  }

  // ---------- 数据 ----------

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
      return call('GET', task[0], task[1])
    }).then(function (res) {
      state.queue = listOf(res[0])
      state.doctors = (res[1] && res[1].doctors) || []
      state.patients = listOf(res[2])
      state.orgs = listOf(res[3])
      state.depts = uniqBy(listOf(res[4]), 'dept_name')
      state.ready = true
      if (state.msgKind === 'err') setMsg('')
    }).catch(function (e) {
      setMsg((e && e.message) || '数据加载失败', 'err')
    }).then(function () {
      state.loading = false
      paint()
    })
  }

  function toggleForm() {
    var wrap = $('hx-cw-form-wrap')
    if (!wrap) return
    wrap.hidden = !wrap.hidden
    if (!wrap.hidden) {
      syncForm()
      setFormMsg('')
    }
  }

  function submitForm() {
    if (state.busy) return setFormMsg('上一步操作还在进行，请稍候', 'err')
    var pid = ($('hx-cw-f-patient') || {}).value || ''
    var hospital = ($('hx-cw-f-hospital') || {}).value || ''
    var dept = ($('hx-cw-f-dept') || {}).value || ''
    if (!pid) return setFormMsg('请选择患者', 'err')
    if (!hospital || !dept) return setFormMsg('请选择目标医院与科室', 'err')

    var patient = state.patients.filter(function (p) {
      return p.patientId === pid
    })[0] || {}

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
    }).then(function (data) {
      setFormMsg('')
      $('hx-cw-form-wrap').hidden = true
      var code = (data && data.consultCode) || ''
      setMsg('会诊已发起' + (code ? '：' + code : '') +
        (data && data.rtcReady ? '，已接入远程会诊系统' : '，音视频服务未就绪，已生成会诊单'), data && data.rtcReady ? 'ok' : '')
      return loadAll()
    }).catch(function (e) {
      setFormMsg((e && e.message) || '发起失败', 'err')
    }).then(function () {
      state.busy = false
    })
  }

  function accept(sessionId) {
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
    if (state.busy) return setMsg('上一步操作还在进行，请稍候', 'err')
    state.busy = true
    setMsg('正在获取入会链接…')
    // 必须在用户手势里同步开窗：等 fetch 回来再 window.open 会被当成非用户手势拦截
    var win = window.open('about:blank', '_blank')
    if (win) {
      try {
        win.document.write('<p style="font-family:system-ui,sans-serif;padding:24px;color:#475569">正在进入远程会诊系统…</p>')
        win.document.close()
        win.opener = null
      } catch (e) {
        /* 跨源或已被回收，忽略 */
      }
    }
    call('GET', '/consultations/' + encodeURIComponent(sessionId) + '/join-link', { _t: Date.now() })
      .then(function (link) {
        var url = link && link.joinUrl
        if (!url) throw new Error('未获取到入会链接')
        setMsg('')
        if (win) win.location.href = url
        else location.href = url
      })
      .catch(function (e) {
        if (win) {
          try {
            win.close()
          } catch (x) {
            /* ignore */
          }
        }
        setMsg((e && e.message) || '获取入会链接失败', 'err')
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
    state.ready = false
  }

  function tick() {
    if (path() !== ROUTE) {
      if ($(HOST_ID) || document.body.classList.contains(BODY_FLAG)) unmount()
      return
    }
    ensureStyle()
    if (!document.body.classList.contains(BODY_FLAG)) document.body.classList.add(BODY_FLAG)

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

  window.hxEnhance(tick, { wait: 300, observeRoot: true, afterNav: 120 })
  // 兜底：布局变化（窗口缩放、字体加载、侧栏展开）时重算位置，并保证节点不丢
  setInterval(tick, 900)
  window.addEventListener('resize', tick)
})()
