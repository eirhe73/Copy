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
      .map(
        (d) => `<article class="hx-dept-bed-card" data-dept="${esc(d.id)}">
          <h4>${esc(d.name)}</h4>
          <ul>
            <li><span>总床</span><strong>${d.total ?? '—'}</strong></li>
            <li><span>在用</span><strong>${d.occupied ?? '—'}</strong></li>
            <li><span>预留</span><strong>${d.reserved ?? '—'}</strong></li>
            <li><span>空床</span><strong class="hx-dept-bed-free">${d.free ?? '—'}</strong></li>
          </ul>
        </article>`,
      )
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
  }

  function render() {
    redirectSubHospitalsRoute()
    redirectBedsRoute()
    syncViewMode()
    remove('hx-sub-hospital-monitor')
    loadJson('/api/grassroots-remote-monitor.json', remoteCache).then(renderGrassrootsRemote)
    loadJson('/api/beds-by-dept.json', bedsCache).then(renderDeptBeds)
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
    redirectBedsRoute()
  })

  window.hxEnhance(render, { wait: 350, afterNav: 90 })
})()
