/**
 * 科室监控内嵌科室床位、/beds 与旧 sub-hospitals 链接重定向
 */
;(function () {
  function pathAndQuery() {
    const raw = location.hash.replace(/^#/, '') || '/'
    const [pathname, search = ''] = raw.split('?')
    const p = (pathname || '/').replace(/\/$/, '') || '/'
    return { p, q: new URLSearchParams(search) }
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function cleanNotice(s) {
    return String(s || '')
      .replace(/演示\s*Mock[^·]*·?\s*/gi, '')
      .replace(/非实时\s*HIS/gi, '')
      .trim()
  }

  function findDeptHost() {
    const main = document.querySelector('main.department-overview.screen')
    if (!main) return null
    return main.querySelector('section') || main
  }

  function mount(host, id, html) {
    if (!host) return false
    let box = document.getElementById(id)
    if (!box) {
      box = document.createElement('div')
      box.id = id
      host.appendChild(box)
    }
    if (box.dataset.html === html) return true
    box.dataset.html = html
    box.innerHTML = html
    return true
  }

  function remove(id) {
    document.getElementById(id)?.remove()
  }

  function syncViewMode() {
    const { p, q } = pathAndQuery()
    const dept = p === '/warning' && q.get('view') === 'departments'
    document.body.classList.remove('hx-ia-sub-hospitals-view')
    document.body.classList.toggle('hx-ia-departments-view', dept)
  }

  /** React 科室监控右栏自带「手机通知」演示块，桌面科室页应走侧栏「手机通知演示」路由 */
  function hidePhoneNoticeOnDepartmentView() {
    const { p, q } = pathAndQuery()
    const dept = p === '/warning' && q.get('view') === 'departments'
    document.querySelectorAll('main.department-overview.screen .panel[data-hx-desktop-hidden]').forEach((panel) => {
      panel.removeAttribute('data-hx-desktop-hidden')
      panel.hidden = false
    })
    if (!dept) return
    const main = document.querySelector('main.department-overview.screen')
    if (!main) return
    main.querySelectorAll('.panel').forEach((panel) => {
      const titleEl = panel.querySelector('.panel-title h2, .panel-title')
      const title = (titleEl?.textContent || '').replace(/\s+/g, '')
      if (!title.includes('手机通知')) return
      panel.setAttribute('data-hx-desktop-hidden', '1')
      panel.hidden = true
    })
  }

  function redirectSubHospitalsRoute() {
    const { p, q } = pathAndQuery()
    if (p !== '/warning' || q.get('view') !== 'sub-hospitals') return
    const qs = new URLSearchParams({ view: 'departments' })
    location.replace(`${location.pathname}${location.search}#/warning?${qs.toString()}`)
  }

  function redirectBedsRoute() {
    const { p, q } = pathAndQuery()
    if (p !== '/beds') return
    const org = q.get('org') || ''
    const dept = q.get('dept') || ''
    const qs = new URLSearchParams({ view: 'departments' })
    if (org) qs.set('org', org)
    if (dept) qs.set('dept', dept)
    location.replace(`${location.pathname}${location.search}#/warning?${qs.toString()}`)
  }

  function renderDeptBeds(bedsPayload) {
    const { p, q } = pathAndQuery()
    if (p !== '/warning' || q.get('view') !== 'departments') {
      remove('hx-dept-beds-panel')
      return
    }
    const host = findDeptHost()
    if (!host) return

    const focusOrg = q.get('org') || ''
    const focusDept = q.get('dept') || ''
    const depts = bedsPayload?.departments || []
    const filtered = depts.filter((d) => {
      if (focusDept && d.id !== focusDept) return false
      return true
    })

    const cards = (filtered.length ? filtered : depts)
      .map((d) => {
        const occ =
          d.total && d.occupied != null ? Math.round((Number(d.occupied) / Number(d.total)) * 100) : null
        const occCls = occ != null && occ >= 90 ? ' hx-dept-bed-occ--high' : ''
        return `<article class="hx-dept-bed-card" data-dept="${esc(d.id)}">
          <h4>${esc(d.name)}${occ != null ? `<em class="hx-dept-bed-occ${occCls}">${occ}%</em>` : ''}</h4>
          <ul>
            <li><span>总床</span><strong>${d.total ?? '—'}</strong></li>
            <li><span>在用</span><strong>${d.occupied ?? '—'}</strong></li>
            <li><span>预留</span><strong>${d.reserved ?? '—'}</strong></li>
            <li><span>空床</span><strong class="hx-dept-bed-free">${d.free ?? '—'}</strong></li>
          </ul>
        </article>`
      })
      .join('')

    const html = `<section id="hx-dept-beds-panel" class="hx-dept-beds-panel" aria-label="科室床位">
      <header class="hx-dept-beds-head">
        <strong>科室床位</strong>
        <span>已并入科室监控 · ${esc(bedsPayload?.hospitalId || '本院')}${focusDept ? ` · 当前科室 ${esc(focusDept)}` : ''}</span>
      </header>
      <div class="hx-dept-beds-grid">${cards || '<p class="hx-ia-view-empty">暂无床位统计数据</p>'}</div>
    </section>`

    let box = document.getElementById('hx-dept-beds-panel')
    if (box && box.dataset.html === html) return
    remove('hx-dept-beds-panel')
    host.insertAdjacentHTML('beforeend', html)
    const panel = document.getElementById('hx-dept-beds-panel')
    if (panel) panel.dataset.html = html

    host.querySelectorAll('.department-matrix a[href*="/beds"]').forEach((a) => {
      const href = a.getAttribute('href') || ''
      const m = href.match(/org=([^&]+).*dept=([^&]+)/)
      if (!m) return
      a.setAttribute('href', `#/warning?view=departments&org=${decodeURIComponent(m[1])}&dept=${decodeURIComponent(m[2])}`)
    })

    if (focusDept && panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function renderGrassrootsRemote(data) {
    const { p, q } = pathAndQuery()
    if (p !== '/critical' || q.get('mode') !== 'grassroots-remote') {
      remove('hx-grassroots-remote')
      return
    }
    const host =
      document.querySelector('main.workspace') ||
      document.querySelector('main.critical-screen') ||
      findDeptHost()
    if (!host || !data) return
    const cards = (data.sites || [])
      .map(
        (s) => `<article class="hx-gr-card">
          <h3>${esc(s.name)}</h3>
          <p><span class="muted">患者</span> ${esc(s.patient)}</p>
          <p><span class="muted">体征</span> ${esc(s.vitals)}</p>
          <div class="hx-gr-actions">
            <a class="hx-gr-btn" href="${esc(s.videoHref)}">重症监护</a>
            <a class="hx-gr-btn ghost" href="${esc(s.bedHref)}">床位 / ICU</a>
          </div>
        </article>`,
      )
      .join('')
    const notice = cleanNotice(data.notice)
    const html = `<section class="hx-grassroots-remote" aria-label="${esc(data.title)}">
      <header class="hx-ia-view-head"><strong>${esc(data.title)}</strong>${notice ? `<span>${esc(notice)}</span>` : ''}</header>
      <div class="hx-gr-grid">${cards || '<p class="hx-ia-view-empty">暂无监护点数据</p>'}</div>
    </section>`
    mount(host, 'hx-grassroots-remote', html)
  }

  const remoteCache = { value: null, promise: null }
  const bedsCache = { value: null, promise: null }
  const monitorCache = { value: null, promise: null }

  function panelDataKey(titleRaw) {
    const n = String(titleRaw || '').replace(/\s+/g, '')
    if (n.includes('检验危急')) return 'criticalLabs'
    if (n.includes('血管活性')) return 'vasoactive'
    if (n.includes('NEWS') || n.includes('体征')) return 'newsScores'
    return null
  }

  function fmtMonitorTime(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso).slice(11, 16) || '—'
    return d.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  function toneClass(tone) {
    if (tone === 'danger') return 'hx-dm-kpi--danger'
    if (tone === 'warn') return 'hx-dm-kpi--warn'
    if (tone === 'info') return 'hx-dm-kpi--info'
    return ''
  }

  function statusPill(s) {
    const t = String(s || '')
    let cls = 'hx-dm-pill'
    if (/待|未/.test(t)) cls += ' hx-dm-pill--wait'
    else if (/干预|进行/.test(t)) cls += ' hx-dm-pill--doing'
    else cls += ' hx-dm-pill--ok'
    return `<span class="${cls}">${esc(t || '—')}</span>`
  }

  function compactTable(rows, cols) {
    if (!rows.length) return ''
    const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join('')
    const body = rows
      .map((row) => {
        const tds = cols
          .map((c) => {
            const raw = typeof c.key === 'function' ? c.key(row) : row[c.key]
            return `<td>${raw ?? '—'}</td>`
          })
          .join('')
        return `<tr>${tds}</tr>`
      })
      .join('')
    return `<div class="hx-dm-mini-table business-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
  }

  function renderMonitorBanner(section, ctx) {
    if (!section || !ctx) return
    const shift = ctx.shift || {}
    const kpis = ctx.kpis || []
    const links = ctx.quickLinks || []
    const kpiHtml = kpis
      .map(
        (k) => `<article class="hx-dm-kpi ${toneClass(k.tone)}">
          <span class="hx-dm-kpi-label">${esc(k.label)}</span>
          <strong class="hx-dm-kpi-val">${esc(k.value)}</strong>
          <small>${esc(k.hint || '')}</small>
        </article>`,
      )
      .join('')
    const linkHtml = links
      .map((l) => `<a class="hx-dm-quick" href="${esc(l.href)}">${esc(l.label)}</a>`)
      .join('')
    const html = `<header id="hx-dept-monitor-banner" class="hx-dept-monitor-banner" aria-label="科室监控概览">
      <div class="hx-dept-monitor-banner-top">
        <div>
          <strong>${esc(ctx.hospitalName || '本院')}</strong>
          <span>${esc(ctx.campus || '')} · 科室早期预警工作台</span>
        </div>
        <div class="hx-dept-monitor-shift">
          <span class="hx-dm-pill hx-dm-pill--shift">${esc(shift.label || '值班')}</span>
          <span>${esc(shift.window || '')}</span>
          <span>总值 ${esc(shift.dutyDoctor || '—')}</span>
          <span>总护 ${esc(shift.chargeNurse || '—')}</span>
        </div>
        <time class="hx-dept-monitor-time">刷新 ${esc(fmtMonitorTime(ctx.updatedAt))}</time>
      </div>
      <div class="hx-dept-monitor-kpis">${kpiHtml}</div>
      <p class="hx-dept-monitor-note">${esc(shift.note || '')}</p>
      <nav class="hx-dept-monitor-links" aria-label="快捷入口">${linkHtml}</nav>
    </header>`
    const totals = section.querySelector('.department-totals')
    let box = document.getElementById('hx-dept-monitor-banner')
    if (box && box.dataset.html === html) return
    remove('hx-dept-monitor-banner')
    if (totals) totals.insertAdjacentHTML('beforebegin', html)
    else section.insertAdjacentHTML('afterbegin', html)
    box = document.getElementById('hx-dept-monitor-banner')
    if (box) box.dataset.html = html
  }

  function renderTodayFocus(section, ctx) {
    if (!section || !ctx) return
    const items = ctx.todayFocus || []
    const res = ctx.resources || []
    const focusHtml = items
      .map(
        (f) => `<li class="hx-dm-focus hx-dm-focus--${esc(f.tone || 'neutral')}">
          <b>${esc(f.label)}</b><span>${esc(f.desc)}</span>
        </li>`,
      )
      .join('')
    const resHtml = res
      .map(
        (r) => `<li class="hx-dm-res hx-dm-res--${r.status === '关注' ? 'warn' : 'ok'}">
          <span>${esc(r.name)}</span><strong>${esc(r.value)}</strong>
        </li>`,
      )
      .join('')
    const html = `<section id="hx-dept-today-focus" class="hx-dept-today-focus" aria-label="今日关注与资源">
      <div class="hx-dept-today-col">
        <h4>今日关注</h4>
        <ul>${focusHtml || '<li class="hx-ia-view-empty">暂无</li>'}</ul>
      </div>
      <div class="hx-dept-today-col">
        <h4>关键资源（后勤/设备）</h4>
        <ul class="hx-dept-res-list">${resHtml || '<li class="hx-ia-view-empty">暂无</li>'}</ul>
      </div>
    </section>`
    const matrix = section.querySelector('.department-matrix')
    let box = document.getElementById('hx-dept-today-focus')
    if (box && box.dataset.html === html) return
    remove('hx-dept-today-focus')
    if (matrix) matrix.insertAdjacentHTML('afterend', html)
    else if (document.getElementById('hx-dept-beds-panel')) {
      document.getElementById('hx-dept-beds-panel').insertAdjacentHTML('beforebegin', html)
    } else section.insertAdjacentHTML('beforeend', html)
    box = document.getElementById('hx-dept-today-focus')
    if (box) box.dataset.html = html
  }

  function enrichLeftPanels(main, ctx) {
    if (!main || !ctx) return
    const aside = main.querySelector('aside:first-of-type')
    if (!aside) return
    aside.querySelectorAll('.panel').forEach((panel) => {
      const title = panel.querySelector('.panel-title h2, .panel-title')?.textContent || ''
      const key = panelDataKey(title)
      if (!key) return
      const rows = ctx[key] || []
      if (!rows.length) return
      const body = panel.querySelector('.panel-body')
      if (!body || body.querySelector('.hx-dm-mini-table')) return
      let table = ''
      if (key === 'criticalLabs') {
        table = compactTable(rows, [
          { label: '床/区', key: 'bed' },
          { label: '项目', key: 'item' },
          { label: '状态', key: (r) => statusPill(r.status) },
        ])
      } else if (key === 'vasoactive') {
        table = compactTable(rows, [
          { label: '床', key: 'bed' },
          { label: '药物', key: 'drug' },
          { label: '状态', key: (r) => statusPill(r.status) },
        ])
      } else {
        table = compactTable(rows, [
          { label: '床', key: 'bed' },
          { label: '评分', key: 'score' },
          { label: '状态', key: (r) => statusPill(r.status) },
        ])
      }
      body.insertAdjacentHTML('beforeend', table)
    })
  }

  function enrichHandHygiene(main, ctx) {
    const hh = ctx?.handHygiene
    if (!main || !hh) return
    main.querySelectorAll('aside:last-of-type .panel').forEach((panel) => {
      const title = (panel.querySelector('.panel-title h2, .panel-title')?.textContent || '').replace(/\s+/g, '')
      if (!title.includes('手卫生')) return
      const body = panel.querySelector('.panel-body')
      if (!body || body.dataset.hxHygiene === '1') return
      body.dataset.hxHygiene = '1'
      const wards = (hh.wards || [])
        .map(
          (w) => `<li><span>${esc(w.name)}</span><span class="hx-dm-hh-bar"><i style="width:${Math.min(100, w.rate)}%"></i></span><b>${w.rate}%</b></li>`,
        )
        .join('')
      body.innerHTML = `<div class="hx-dm-hh">
        <div class="hx-dm-hh-main"><strong>${hh.rate}%</strong><span>${esc(hh.period || '')}</span></div>
        <p class="hx-dm-hh-meta">观察 ${hh.observations ?? '—'} 次 · 依从 ${hh.compliant ?? '—'} 次 · ${esc(hh.source || '')}</p>
        <ul class="hx-dm-hh-wards">${wards}</ul>
      </div>`
    })
  }

  function enhancePendingPanel(main) {
    const panel = main?.querySelector('section > .panel')
    if (!panel) return
    const body = panel.querySelector('.panel-body')
    if (!body || body.querySelector('.hx-dm-pending-table')) return
    const ps = [...body.querySelectorAll(':scope > p')]
    if (!ps.length) return
    const rows = ps
      .map((p) => {
        const link = p.querySelector('a')
        const name = link ? link.textContent.trim() : '—'
        const href = link ? link.getAttribute('href') || '#' : '#'
        const text = (p.textContent || '').replace(name, '').replace(/^[·\s]+/, '').trim()
        const parts = text.split('·').map((s) => s.trim())
        const title = parts[0] || '—'
        const note = parts.slice(1).join(' · ') || '等待现场核对'
        let tone = 'wait'
        if (/干预|治疗|吸氧|升压/.test(note + title)) tone = 'doing'
        if (/低|下降|异常/.test(title)) tone = 'danger'
        return `<tr class="hx-dm-pending-row hx-dm-pending-row--${tone}">
          <td><a href="${esc(href)}">${esc(name)}</a></td>
          <td>${esc(title)}</td>
          <td class="hx-dm-pending-note">${esc(note)}</td>
          <td><a class="hx-dm-pending-go" href="${esc(href)}">患者档案</a></td>
        </tr>`
      })
      .join('')
    body.innerHTML = `<div class="hx-dm-pending-table business-table table-scroll">
      <table>
        <thead><tr><th>患者</th><th>预警项</th><th>现场说明</th><th>操作</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }

  function clearDeptMonitorEnhance() {
    remove('hx-dept-monitor-banner')
    remove('hx-dept-today-focus')
    const main = document.querySelector('main.department-overview.screen')
    if (!main) return
    main.querySelectorAll('.hx-dm-mini-table').forEach((el) => el.remove())
    main.querySelectorAll('[data-hx-hygiene]').forEach((el) => {
      delete el.dataset.hxHygiene
    })
    main.querySelectorAll('.hx-dm-pending-table').forEach((el) => el.remove())
  }

  function renderDeptMonitorContext(ctx) {
    const { p, q } = pathAndQuery()
    if (p !== '/warning' || q.get('view') !== 'departments') {
      clearDeptMonitorEnhance()
      return
    }
    const main = document.querySelector('main.department-overview.screen')
    const section = findDeptHost()
    if (!main || !section || !ctx) return
    renderMonitorBanner(section, ctx)
    renderTodayFocus(section, ctx)
    enrichLeftPanels(main, ctx)
    enrichHandHygiene(main, ctx)
    enhancePendingPanel(main)
  }

  function loadJson(url, cache) {
    if (cache.value) return Promise.resolve(cache.value)
    if (cache.promise) return cache.promise
    cache.promise = fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        cache.value = d
        return d
      })
      .catch(() => null)
    return cache.promise
  }

  function resetCaches() {
    remoteCache.value = null
    remoteCache.promise = null
    bedsCache.value = null
    bedsCache.promise = null
    monitorCache.value = null
    monitorCache.promise = null
  }

  function render() {
    redirectSubHospitalsRoute()
    redirectBedsRoute()
    syncViewMode()
    hidePhoneNoticeOnDepartmentView()
    remove('hx-sub-hospital-monitor')
    loadJson('/api/grassroots-remote-monitor.json', remoteCache).then(renderGrassrootsRemote)
    loadJson('/api/beds-by-dept.json', bedsCache).then(renderDeptBeds)
    loadJson('/api/dept-monitor-context.json', monitorCache).then(renderDeptMonitorContext)
  }

  document.addEventListener(
    'click',
    (e) => {
      const a = e.target instanceof Element ? e.target.closest('nav.subnav > a') : null
      if (!a || (a.textContent || '').trim() !== '科室床位') return
      e.preventDefault()
      e.stopPropagation()
      location.hash = '#/warning?view=departments'
    },
    true,
  )

  window.addEventListener('hashchange', () => {
    resetCaches()
    redirectSubHospitalsRoute()
    syncViewMode()
    hidePhoneNoticeOnDepartmentView()
    redirectBedsRoute()
  })

  window.hxEnhance(render, { wait: 350, afterNav: 90 })
})()
