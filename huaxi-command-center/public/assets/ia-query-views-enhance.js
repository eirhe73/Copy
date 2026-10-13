/**
 * 导图补项：下级医院科室监控、基层远程监护、基层 scope 提示
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

  function mountBanner(host, id, html) {
    if (!host) return
    let box = document.getElementById(id)
    if (!box) {
      box = document.createElement('div')
      box.id = id
      host.insertBefore(box, host.firstChild)
    }
    if (box.dataset.html === html) return
    box.dataset.html = html
    box.innerHTML = html
  }

  function remove(id) {
    document.getElementById(id)?.remove()
  }

  function renderSubHospitals(data) {
    const { p, q } = pathAndQuery()
    if (p !== '/warning' || q.get('view') !== 'sub-hospitals') {
      remove('hx-sub-hospital-monitor')
      return
    }
    const host = document.querySelector('main.warning-screen, .warning-screen, main.workspace')
    if (!host || !data) return
    const rows = (data.hospitals || [])
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
          <table class="hx-sh-table"><thead><tr><th>科室</th><th>床位</th><th>预警</th><th>状态</th></tr></thead><tbody>${deptRows}</tbody></table>
        </section>`
      })
      .join('')
    const html = `<section class="hx-sub-hospital-monitor" aria-label="${esc(data.title)}">
      <header class="hx-ia-view-head"><strong>${esc(data.title)}</strong><span>${esc(data.notice || '')}</span></header>
      <div class="hx-sh-grid">${rows}</div>
      <p class="hx-ia-view-foot muted">完整预警处置仍见下方「高危预警处置闭环」。</p>
    </section>`
    mountBanner(host, 'hx-sub-hospital-monitor', html)
  }

  function renderGrassrootsRemote(data) {
    const { p, q } = pathAndQuery()
    if (p !== '/critical' || q.get('mode') !== 'grassroots-remote') {
      remove('hx-grassroots-remote')
      return
    }
    const host = document.querySelector('main.workspace, main.critical-workspace, .critical-board, main')
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
    const html = `<section class="hx-grassroots-remote" aria-label="${esc(data.title)}">
      <header class="hx-ia-view-head"><strong>${esc(data.title)}</strong><span>${esc(data.notice || '')}</span></header>
      <div class="hx-gr-grid">${cards}</div>
      <p class="hx-ia-view-foot muted">下方为县域 ICU 总览；本页侧重基层上转远程监护演示。</p>
    </section>`
    mountBanner(host, 'hx-grassroots-remote', html)
  }

  function renderScopeBanners() {
    const { p, q } = pathAndQuery()
    remove('hx-ia-scope-banner')
    let text = ''
    if (p === '/consultations' && q.get('scope') === 'grassroots') {
      text = '智慧急救调度 · 基层会诊（演示筛：基层来源）'
    } else if (p === '/transfers' && q.get('scope') === 'grassroots') {
      text = '智慧急救调度 · 医院转诊（演示筛：上转 / 基层机构）'
    }
    if (!text) return
    const host = document.querySelector('main.workspace') || document.querySelector('main')
    if (!host) return
    mountBanner(
      host,
      'hx-ia-scope-banner',
      `<div class="hx-ia-scope-banner"><span>${esc(text)}</span><a href="/#/consultations?scope=grassroots">演示链</a></div>`,
    )
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

  function render() {
    renderScopeBanners()
    loadJson('/api/sub-hospital-monitor.json', subCache).then(renderSubHospitals)
    loadJson('/api/grassroots-remote-monitor.json', remoteCache).then(renderGrassrootsRemote)
  }

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
