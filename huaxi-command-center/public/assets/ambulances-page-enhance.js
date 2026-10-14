/**
 * 侧栏一体化：#/ambulances 独立整页（不与 #/dispatch 共用调度壳）
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function hashQuery() {
    const raw = location.hash.replace(/^#/, '')
    return new URLSearchParams(raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '')
  }

  function sidebarMode() {
    return document.body.classList.contains('hx-sidebar-shell')
  }

  function normalizeLegacyHub() {
    if (!sidebarMode()) return
    if (path() === '/dispatch' && hashQuery().get('hub') === 'ambulances') {
      location.replace(`${location.pathname}${location.search}#/ambulances`)
    }
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function fmtClock(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('zh-CN', { hour12: false })
    } catch {
      return iso
    }
  }

  async function loadRows() {
    if (window.hxBackend?.strict?.() && (await window.hxBackend.ensureAuth?.())) {
      try {
        const rows = await window.hxBackend.list('/ambulances', {})
        if (Array.isArray(rows) && rows.length) {
          return { updatedAt: new Date().toISOString(), rows }
        }
      } catch {
        /* fallback json */
      }
    }
    const res = await fetch('/api/dispatch-ambulances.json', { cache: 'no-store' })
    const data = await res.json()
    return { updatedAt: data.updatedAt, rows: data.ambulances || [] }
  }

  function rowHtml(row) {
    const plate = row.plate || row.vehicle_id || row.id || '—'
    const id = row.id || row.vehicle_id || ''
    const org = row.org || row.organization || '—'
    const hospital = row.boundHospital || row.bound_hospital || row.hospital || '—'
    const crew = row.crew || row.team || '—'
    const status = row.status || '—'
    const ev = row.currentEventId || row.current_event_id || '—'
    const liveHref = `#/dispatch?vehicle=${encodeURIComponent(id)}&plate=${encodeURIComponent(plate)}`
    return `<tr>
      <td><strong>${esc(plate)}</strong><br><small>${esc(id)}</small></td>
      <td>${esc(org)}</td>
      <td>${esc(hospital)}</td>
      <td>${esc(crew)}</td>
      <td>${esc(status)}</td>
      <td>${esc(ev)}</td>
      <td class="hx-amb-actions"><a class="btn-ghost" href="${liveHref}">实时出警</a></td>
    </tr>`
  }

  async function renderPage() {
    normalizeLegacyHub()
    if (document.body.classList.contains('hx-dispatch-vue-embed')) {
      document.body.classList.remove('hx-page-ambulances')
      document.getElementById('hx-ambulances-page')?.remove()
      return
    }
    if (path() !== '/ambulances' || !sidebarMode()) {
      document.body.classList.remove('hx-page-ambulances')
      document.getElementById('hx-ambulances-page')?.remove()
      return
    }

    document.body.classList.add('hx-page-ambulances')
    const shell = document.querySelector('.app-shell.hx-sidebar-ready')
    if (!shell) return

    let page = document.getElementById('hx-ambulances-page')
    if (!page) {
      page = document.createElement('main')
      page.id = 'hx-ambulances-page'
      page.className = 'hx-ambulances-page workspace screen'
      page.setAttribute('aria-label', '救护车列表')
      shell.appendChild(page)
    }

    if (page.dataset.loading === '1') return
    page.dataset.loading = '1'
    page.innerHTML =
      '<header class="hx-amb-head"><div><h1>救护车列表</h1><p class="api-muted">本院绑定车辆、班组与当前出警状态</p></div><p class="hx-amb-meta">加载中…</p></header>'

    try {
      const { updatedAt, rows } = await loadRows()
      if (path() !== '/ambulances') return
      const body =
        rows.length === 0
          ? '<p class="hx-amb-empty">暂无车辆数据</p>'
          : `<div class="business-table table-scroll"><table><thead><tr>
            <th>车牌 / ID</th><th>所属</th><th>绑定医院</th><th>班组</th><th>状态</th><th>关联事件</th><th></th>
          </tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div>`
      page.innerHTML = `<header class="hx-amb-head">
          <div><h1>救护车列表</h1><p class="api-muted">本院绑定车辆、班组与当前出警状态</p></div>
          <p class="hx-amb-meta">${rows.length} 辆 · 更新 ${esc(fmtClock(updatedAt))}</p>
        </header>
        <section class="hx-amb-body">${body}</section>`
    } catch (e) {
      page.innerHTML = `<header class="hx-amb-head"><h1>救护车列表</h1></header>
        <p class="hx-amb-empty">加载失败：${esc(e && e.message ? e.message : e)}</p>`
    } finally {
      delete page.dataset.loading
    }
  }

  window.hxEnhance(() => renderPage(), { wait: 220, afterNav: 120 })
  window.addEventListener('hashchange', () => renderPage())
  normalizeLegacyHub()
})()
