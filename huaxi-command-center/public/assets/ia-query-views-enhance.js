/**
 * 导图补项：下级医院科室监控、基层远程监护
 */
;(function () {
  function pathAndQuery() {
    const raw = location.hash.replace(/^#/, '') || '/'
    const [pathname, search = ''] = raw.split('?')
    const p = (pathname || '/').replace(/\/$/, '') || '/'
    return { p, q: new URLSearchParams(search) }
  }

  function esc(s) {
    return String(s)
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

  function findHost() {
    return (
      document.querySelector('main.department-overview.screen') ||
      document.querySelector('main.warning-screen.screen') ||
      document.querySelector('main.warning-screen') ||
      document.querySelector('.warning-screen') ||
      document.querySelector('main.workspace')
    )
  }

  function mountBanner(host, id, html) {
    if (!host) return false
    let box = document.getElementById(id)
    if (!box) {
      box = document.createElement('div')
      box.id = id
      host.insertBefore(box, host.firstChild)
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
    const sub = p === '/warning' && q.get('view') === 'sub-hospitals'
    const dept = p === '/warning' && q.get('view') === 'departments'
    document.body.classList.toggle('hx-ia-sub-hospitals-view', sub)
    document.body.classList.toggle('hx-ia-departments-view', dept)
  }

  function renderSubHospitals(data) {
    const { p, q } = pathAndQuery()
    syncViewMode()
    if (p !== '/warning' || q.get('view') !== 'sub-hospitals') {
      remove('hx-sub-hospital-monitor')
      return
    }
    const host = findHost()
    if (!host) return
    const hospitals = data?.hospitals || []
    const rows = hospitals
      .map((h) => {
        const deptRows = (h.departments || [])
          .map(
            (d) => `<tr>
              <td>${esc(d.name)}</td>
              <td>${d.bedsUsed}/${d.bedsTotal}</td>
              <td>${d.alerts}</td>
              <td><span class="hx-sh-status">${esc(d.status)}</span></td>
            </tr>`,
          )
          .join('')
        return `<section class="hx-sh-block">
          <header><strong>${esc(h.name)}</strong><span class="muted">${esc(h.tier)}</span></header>
          <table class="hx-sh-table"><thead><tr><th>科室</th><th>床位</th><th>预警</th><th>状态</th></tr></thead><tbody>${deptRows || '<tr><td colspan="4">暂无科室数据</td></tr>'}</tbody></table>
        </section>`
      })
      .join('')
    const notice = cleanNotice(data?.notice)
    const html = `<section class="hx-sub-hospital-monitor" aria-label="${esc(data?.title || '下级医院科室监控')}">
      <header class="hx-ia-view-head"><strong>${esc(data?.title || '下级医院科室监控')}</strong>${notice ? `<span>${esc(notice)}</span>` : ''}</header>
      <div class="hx-sh-grid">${rows || '<p class="hx-ia-view-empty">暂无机构数据，请检查后端 organizations / beds/by-dept 或刷新页面。</p>'}</div>
    </section>`
    mountBanner(host, 'hx-sub-hospital-monitor', html)
  }

  function renderGrassrootsRemote(data) {
    const { p, q } = pathAndQuery()
    if (p !== '/critical' || q.get('mode') !== 'grassroots-remote') {
      remove('hx-grassroots-remote')
      return
    }
    const host = findHost()
    if (!host || !data) return
    const cards = (data.sites || [])
      .map(
        (s) => `<article class="hx-gr-card">
          <h3>${esc(s.name)}</h3>
          <p><span class="muted">患者</span> ${esc(s.patient)}</p>
          <p><span class="muted">体征</span> ${esc(s.vitals)}</p>
          <div class="hx-gr-actions">
            <a class="hx-gr-btn" href="${esc(s.videoHref)}">视频监控</a>
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
    mountBanner(host, 'hx-grassroots-remote', html)
  }

  function renderScopeBanners() {
    remove('hx-ia-scope-banner')
  }

  let subData = null
  let remoteData = null

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

  const subCache = { value: null, promise: null }
  const remoteCache = { value: null, promise: null }

  function resetCaches() {
    subCache.value = null
    subCache.promise = null
    remoteCache.value = null
    remoteCache.promise = null
  }

  function render() {
    syncViewMode()
    renderScopeBanners()
    loadJson('/api/sub-hospital-monitor.json', subCache).then(renderSubHospitals)
    loadJson('/api/grassroots-remote-monitor.json', remoteCache).then(renderGrassrootsRemote)
  }

  window.addEventListener('hashchange', () => {
    resetCaches()
    syncViewMode()
  })

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
