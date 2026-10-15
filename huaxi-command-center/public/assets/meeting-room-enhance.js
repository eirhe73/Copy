/**
 * L · 会诊房间页：演示画面布局 + 占位说明（bundle 内 WebRTC 未接时仍可见「会诊室」）
 */
;(function () {
  const BADGE = '演示环境 · 音视频为占位，非商用 RTC'
  const STYLE_ID = 'hx-meeting-room-style'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return
    const s = document.createElement('style')
    s.id = STYLE_ID
    s.textContent = `
.hx-consult-room{margin:0 0 16px;padding:0}
.hx-consult-room__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
.hx-consult-room__head h3{margin:0;font-size:16px;font-weight:600;color:#1e293b}
.hx-consult-room__grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:900px){.hx-consult-room__grid{grid-template-columns:1fr}}
.hx-consult-room__tile{position:relative;border-radius:10px;border:1px solid #e2e8f0;background:#0f172a;min-height:168px;overflow:hidden}
.hx-consult-room__tile--main{grid-column:1/-1;min-height:220px}
.hx-consult-room__label{position:absolute;left:10px;top:10px;z-index:2;font-size:12px;font-weight:600;color:#e2e8f0;background:rgba(15,23,42,.72);padding:4px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.35)}
.hx-consult-room__live{position:absolute;inset:0;background:
  radial-gradient(ellipse 80% 60% at 30% 40%, rgba(59,130,246,.35), transparent 55%),
  radial-gradient(ellipse 70% 50% at 70% 60%, rgba(16,185,129,.25), transparent 50%),
  linear-gradient(160deg,#1e293b 0%,#0f172a 45%,#020617 100%);
  animation:hx-consult-room-pulse 6s ease-in-out infinite}
.hx-consult-room__live::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);opacity:.35;pointer-events:none}
@keyframes hx-consult-room-pulse{0%,100%{filter:saturate(1) brightness(1)}50%{filter:saturate(1.15) brightness(1.08)}}
.hx-consult-room__foot{position:absolute;left:0;right:0;bottom:0;padding:8px 12px;font-size:11px;color:#cbd5e1;background:linear-gradient(transparent,rgba(2,6,23,.85))}
.hx-consult-room__toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.hx-consult-room__toolbar button{font:inherit;font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer}
.hx-consult-room__toolbar button.primary{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
`
    document.head.appendChild(s)
  }

  function tokenFromPath() {
    const p = path()
    if (!p.startsWith('/room/') && !p.startsWith('/join/')) return ''
    return decodeURIComponent(p.split('/')[2] || '')
  }

  function ensureStage() {
    const p = path()
    const inRoom = p.startsWith('/room/') || p.startsWith('/join/') || p.startsWith('/consultation/')
    const existing = document.getElementById('hx-consult-room-stage')
    if (!inRoom) {
      existing?.remove()
      document.getElementById('hx-meeting-demo-badge')?.remove()
      return
    }
    ensureStyle()
    const ws = document.querySelector('main.workspace.screen') || document.querySelector('main.workspace')
    if (!ws) return
    let stage = existing
    if (!stage) {
      stage = document.createElement('section')
      stage.id = 'hx-consult-room-stage'
      stage.className = 'hx-consult-room panel'
      ws.insertBefore(stage, ws.firstChild)
    }
    const tok = tokenFromPath()
    stage.innerHTML =
      '<div class="hx-consult-room__head">' +
      '<h3>远程会诊室 · 多方画面</h3>' +
      '<span class="hx-meeting-demo-badge" id="hx-meeting-demo-badge">' +
      BADGE +
      '</span></div>' +
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
      '<div class="hx-consult-room__foot">主会诊方</div></div>' +
      '</div>' +
      '<div class="hx-consult-room__toolbar">' +
      '<button type="button" class="primary" data-hx-room-act="mic">麦克风（演示）</button>' +
      '<button type="button" data-hx-room-act="cam">摄像头（演示）</button>' +
      '<a class="hx-consult-room__toolbar" href="/#/consultations" style="text-decoration:none">' +
      '<button type="button">返回会诊列表</button></a>' +
      (tok ? '<span style="font-size:11px;color:#64748b;align-self:center">房间 ' + tok.slice(0, 12) + '…</span>' : '') +
      '</div>'

    stage.querySelectorAll('[data-hx-room-act]').forEach((btn) => {
      if (btn.dataset.hxRoomBound === '1') return
      btn.dataset.hxRoomBound = '1'
      btn.addEventListener('click', () => {
        btn.classList.toggle('primary')
      })
    })

    const host = document.querySelector('main.meeting header') || document.querySelector('main.meeting')
    if (host) {
      let el = document.getElementById('hx-meeting-demo-badge-legacy')
      if (!el) {
        el = document.createElement('p')
        el.id = 'hx-meeting-demo-badge-legacy'
        el.className = 'hx-meeting-demo-badge'
        const anchor = host.querySelector('header') || host
        anchor.appendChild(el)
      }
      if (el.textContent !== BADGE) el.textContent = BADGE
    }
  }

  function render() {
    ensureStage()
  }

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
