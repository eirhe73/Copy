/**
 * 会诊室 #/room/:token — 演示多方画面（旧 bundle 未注册 /room 路由时仍可用）
 */
;(function () {
  var BADGE = '演示环境 · 音视频为占位，非商用 RTC'
  var STYLE_ID = 'hx-meeting-room-style'
  var HOST_ID = 'hx-consult-room-host'
  var BODY_FLAG = 'hx-consult-room-active'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function inRoomPath() {
    var p = path()
    return p.indexOf('/room/') === 0 || p.indexOf('/join/') === 0 || p.indexOf('/consultation/') === 0
  }

  function tokenFromPath() {
    var p = path()
    if (!inRoomPath()) return ''
    return decodeURIComponent(p.split('/')[2] || '')
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

  function apiGet(pathname) {
    var url = apiBase() + '/v1' + pathname
    var headers = { Accept: 'application/json' }
    var token = jwt()
    if (token) headers.Authorization = 'Bearer ' + token
    return fetch(url, { headers: headers })
      .then(function (res) {
        return res.json().catch(function () {
          return {}
        }).then(function (json) {
          if (!res.ok || (json && json.code && json.code !== 200)) {
            throw new Error((json && json.message) || 'HTTP ' + res.status)
          }
          return json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json
        })
      })
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return
    var s = document.createElement('style')
    s.id = STYLE_ID
    s.textContent =
      'body.' +
      BODY_FLAG +
      '{overflow:hidden}' +
      'body.' +
      BODY_FLAG +
      ' .app-shell>main.workspace,body.' +
      BODY_FLAG +
      ' .app-shell>main.meeting{visibility:hidden!important;height:0!important;overflow:hidden!important;padding:0!important;margin:0!important}' +
      '#' +
      HOST_ID +
      '{position:fixed;z-index:35;overflow:auto;background:#f0f3f7;padding:10px 12px;box-sizing:border-box}' +
      '.hx-consult-room{margin:0;padding:0}' +
      '.hx-consult-room__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px;flex-wrap:wrap}' +
      '.hx-consult-room__head h3{margin:0;font-size:17px;font-weight:600;color:#1e293b}' +
      '.hx-consult-room__meta{font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5}' +
      '.hx-consult-room__grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '@media(max-width:900px){.hx-consult-room__grid{grid-template-columns:1fr}}' +
      '.hx-consult-room__tile{position:relative;border-radius:10px;border:1px solid #e2e8f0;background:#0f172a;min-height:168px;overflow:hidden}' +
      '.hx-consult-room__tile--main{grid-column:1/-1;min-height:240px}' +
      '.hx-consult-room__label{position:absolute;left:10px;top:10px;z-index:2;font-size:12px;font-weight:600;color:#e2e8f0;background:rgba(15,23,42,.72);padding:4px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.35)}' +
      '.hx-consult-room__live{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 30% 40%, rgba(59,130,246,.35), transparent 55%),radial-gradient(ellipse 70% 50% at 70% 60%, rgba(16,185,129,.25), transparent 50%),linear-gradient(160deg,#1e293b 0%,#0f172a 45%,#020617 100%);animation:hx-consult-room-pulse 6s ease-in-out infinite}' +
      '.hx-consult-room__live::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);opacity:.35;pointer-events:none}' +
      '@keyframes hx-consult-room-pulse{0%,100%{filter:saturate(1) brightness(1)}50%{filter:saturate(1.15) brightness(1.08)}}' +
      '.hx-consult-room__foot{position:absolute;left:0;right:0;bottom:0;padding:8px 12px;font-size:11px;color:#cbd5e1;background:linear-gradient(transparent,rgba(2,6,23,.85))}' +
      '.hx-consult-room__toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}' +
      '.hx-consult-room__toolbar button{font:inherit;font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer}' +
      '.hx-consult-room__toolbar button.primary{background:#1d4ed8;border-color:#1d4ed8;color:#fff}' +
      '.hx-meeting-demo-badge{font-size:11px;color:#64748b;background:#fff;border:1px solid #e2e8f0;padding:4px 10px;border-radius:999px}'
    document.head.appendChild(s)
  }

  function place(host) {
    var shell = document.querySelector('.app-shell.hx-sidebar-ready') || document.querySelector('.app-shell')
    var anchor = shell || document.querySelector('main.workspace') || document.querySelector('#root')
    if (!anchor) {
      host.style.display = 'none'
      return
    }
    var r = anchor.getBoundingClientRect()
    if (shell && shell.classList.contains('hx-sidebar-ready')) {
      host.style.top = Math.max(0, Math.round(r.top)) + 'px'
      host.style.left = Math.round(r.left) + 'px'
      host.style.width = Math.max(200, Math.round(r.width)) + 'px'
      host.style.height = Math.max(200, window.innerHeight - Math.round(r.top) - 6) + 'px'
    } else {
      host.style.top = '0'
      host.style.left = '0'
      host.style.width = '100vw'
      host.style.height = '100dvh'
    }
    host.style.display = 'block'
  }

  function stageHtml(meta) {
    var tok = tokenFromPath()
    var patient = (meta && meta.patient) || {}
    var name = patient.name || '—'
    var cc = patient.chiefComplaint || '—'
    var status = (meta && meta.statusLabel) || (meta && meta.status) || ''
    return (
      '<div class="hx-consult-room panel">' +
      '<div class="hx-consult-room__head">' +
      '<h3>远程会诊室 · ' +
      esc(name) +
      '</h3>' +
      '<span class="hx-meeting-demo-badge">' +
      BADGE +
      '</span></div>' +
      '<p class="hx-consult-room__meta">主诉 ' +
      esc(cc) +
      (status ? ' · 状态 ' + esc(status) : '') +
      (tok ? ' · 房间 ' + esc(tok.slice(0, 14)) + (tok.length > 14 ? '…' : '') : '') +
      '</p>' +
      '<div class="hx-consult-room__grid">' +
      '<div class="hx-consult-room__tile hx-consult-room__tile--main">' +
      '<span class="hx-consult-room__label">患者端 / 床旁</span>' +
      '<div class="hx-consult-room__live" aria-hidden="true"></div>' +
      '<div class="hx-consult-room__foot">演示动画占位 · 正式环境接入摄像头或监护画面</div></div>' +
      '<div class="hx-consult-room__tile">' +
      '<span class="hx-consult-room__label">基层 / 转出医院</span>' +
      '<div class="hx-consult-room__live" aria-hidden="true"></div>' +
      '<div class="hx-consult-room__foot">县乡会诊发起方</div></div>' +
      '<div class="hx-consult-room__tile">' +
      '<span class="hx-consult-room__label">华西 / 受邀专家</span>' +
      '<div class="hx-consult-room__live" aria-hidden="true"></div>' +
      '<div class="hx-consult-room__foot">主会诊方</div></div></div>' +
      '<div class="hx-consult-room__toolbar">' +
      '<button type="button" class="primary" data-hx-room-act="mic">麦克风（演示）</button>' +
      '<button type="button" data-hx-room-act="cam">摄像头（演示）</button>' +
      '<a href="/#/consultations?tab=grassroots" style="text-decoration:none"><button type="button">返回会诊列表</button></a>' +
      '</div></div>'
    )
  }

  function bindToolbar(root) {
    root.querySelectorAll('[data-hx-room-act]').forEach(function (btn) {
      if (btn.dataset.hxRoomBound === '1') return
      btn.dataset.hxRoomBound = '1'
      btn.addEventListener('click', function () {
        btn.classList.toggle('primary')
      })
    })
  }

  function loadRoomMeta(rawToken) {
    if (!rawToken) return Promise.resolve(null)
    return apiGet('/rooms/' + encodeURIComponent(rawToken))
      .catch(function () {
        return apiGet('/consultations/' + encodeURIComponent(rawToken)).then(function (detail) {
          var t = (detail && detail.room && detail.room.token) || detail.token
          if (t && t !== rawToken) return apiGet('/rooms/' + encodeURIComponent(t))
          return detail
        })
      })
      .catch(function () {
        return null
      })
  }

  function unmount() {
    document.body.classList.remove(BODY_FLAG)
    var el = document.getElementById(HOST_ID)
    if (el) el.remove()
    document.getElementById('hx-consult-room-stage')?.remove()
  }

  function tick() {
    if (!inRoomPath()) {
      unmount()
      return
    }
    ensureStyle()
    document.body.classList.add(BODY_FLAG)
    var host = document.getElementById(HOST_ID)
    if (!host) {
      host = document.createElement('div')
      host.id = HOST_ID
      document.body.appendChild(host)
      host.innerHTML = stageHtml(null)
      bindToolbar(host)
      loadRoomMeta(tokenFromPath()).then(function (meta) {
        if (!document.getElementById(HOST_ID) || !inRoomPath()) return
        host.innerHTML = stageHtml(meta)
        bindToolbar(host)
      })
    }
    place(host)

    // 兼容旧 bundle：若存在 main.meeting，保留角标
    var legacy = document.querySelector('main.meeting')
    if (legacy) {
      var el = document.getElementById('hx-meeting-demo-badge-legacy')
      if (!el) {
        el = document.createElement('p')
        el.id = 'hx-meeting-demo-badge-legacy'
        el.className = 'hx-meeting-demo-badge'
        ;(legacy.querySelector('header') || legacy).appendChild(el)
      }
      el.textContent = BADGE
    }
  }

  window.hxEnhance(tick, { wait: 280, afterNav: 80 })
  window.addEventListener('resize', tick)
  setInterval(tick, 800)
})()
