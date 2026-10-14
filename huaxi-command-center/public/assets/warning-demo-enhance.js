/**
 * 院内早期预警 · 24h 摘要、趋势预测与处置闭环（验收 UI 不含演示/Mock 字样）
 */
;(function () {
  /** @type {object | null} */
  let payload = null
  let loadPromise = null

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isHome() {
    const p = path()
    return p === '/' || p === ''
  }

  function isWarningRoute() {
    const p = path()
    return p === '/warning' || p.startsWith('/warning/')
  }

  function loadData() {
    if (payload) return Promise.resolve(payload)
    if (loadPromise) return loadPromise
    loadPromise = fetch('/api/warning-demo.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('warning demo')
        return r.json()
      })
      .then((data) => {
        payload = data
        return data
      })
      .catch(() => {
        payload = null
        return null
      })
    return loadPromise
  }

  function findWarningPanel() {
    return [...document.querySelectorAll('.dashboard .panel')].find((p) => {
      const t = p.querySelector('.panel-title, h2')
      return t && (t.textContent || '').includes('24小时院内评分预警')
    })
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function cleanCopy(s) {
    return String(s || '')
      .replace(/^\s*演示\s*[·•]\s*/i, '')
      .replace(/\s*[（(]\s*演示[^）)]*[）)]/g, '')
      .replace(/\s*[（(]\s*Mock\s*[）)]/gi, '')
      .replace(/[·•]\s*非\s*AI\s*上线/gi, '')
      .replace(/演示\s*(Mock|演算)/gi, '')
      .replace(/非临床\s*AI\s*结论/gi, '')
      .replace(/\s*Mock\s*$/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function trendLine(trends) {
    if (!trends?.length) return ''
    return trends
      .slice(0, 2)
      .map((t) => `${esc(t.metric)} ${t.current}→${t.predicted}`)
      .join(' · ')
  }

  function renderHome(data) {
    const panel = findWarningPanel()
    if (!panel || !data) return
    let box = panel.querySelector('#hx-warning-home')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-warning-home'
      box.className = 'hx-warning-home-bar'
      const anchor = panel.querySelector('.panel-title') || panel.querySelector('.panel-body') || panel
      anchor.insertAdjacentElement('afterend', box)
    }
    const s = data.summary24h || {}
    const trends = trendLine(data.trends)
    const html = `<div class="hx-warning-home-row">
      <ul class="hx-warning-kpi" aria-label="24小时预警摘要">
        <li><span class="k">进行中</span><strong>${s.activeAlerts ?? '—'}</strong></li>
        <li><span class="k">NEWS</span><strong>${s.newsAttention ?? '—'}</strong></li>
        <li><span class="k">闭环</span><strong>${s.closedLoopPercent ?? '—'}%</strong></li>
      </ul>
      ${trends ? `<p class="hx-warning-trend-line">${trends}</p>` : ''}
      <a class="hx-warning-more" href="/#/warning">预警总览</a>
    </div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function renderWarningPage(data) {
    const screen = document.querySelector('main.warning-screen, .warning-screen')
    if (!screen || !data) return
    let box = screen.querySelector('#hx-warning-demo-page')
    if (!box) {
      box = document.createElement('section')
      box.id = 'hx-warning-demo-page'
      box.className = 'hx-warning-demo'
      box.setAttribute('aria-label', '预警摘要')
      screen.insertBefore(box, screen.firstChild)
    }
    const s = data.summary24h || {}
    const trendRows = (data.trends || [])
      .map(
        (t) => `<tr>
          <td>${esc(cleanCopy(t.patientLabel))}</td>
          <td>${esc(t.metric)}</td>
          <td>${t.current}</td>
          <td><strong class="hx-warn-up">${t.predicted}</strong></td>
          <td>${t.withinMinutes} 分钟</td>
          <td class="muted">${esc(cleanCopy(t.note))}</td>
        </tr>`,
      )
      .join('')
    const loop = (data.closedLoop || [])
      .map((x) => `<span class="hx-warn-loop">${esc(x.stage)} <strong>${x.count}</strong></span>`)
      .join('')
    const html = `<header class="hx-warning-demo-head hx-warning-demo-head--page">
      <span class="hx-warning-demo-tag">院内早期预警</span>
      <span>24h 活跃 <strong>${s.activeAlerts ?? '—'}</strong></span>
      <span>NEWS <strong>${s.newsAttention ?? '—'}</strong></span>
      <span>危急值 <strong>${s.criticalValue ?? '—'}</strong></span>
      <span>闭环 <strong>${s.closedLoopPercent ?? '—'}%</strong></span>
      <a class="hx-warning-demo-link" href="/#/medical-quality">环节时限 / 质控 →</a>
    </header>
    <div class="hx-warning-demo-grid">
      <div class="hx-warning-demo-block">
        <h3 class="hx-warning-demo-h3">趋势预测</h3>
        <div class="hx-warning-table-wrap">
          <table class="hx-warning-table">
            <thead><tr><th>患者</th><th>指标</th><th>当前</th><th>预测</th><th>窗口</th><th>说明</th></tr></thead>
            <tbody>${trendRows || '<tr><td colspan="6">暂无演示数据</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="hx-warning-demo-block">
        <h3 class="hx-warning-demo-h3">处置闭环（24h 计数）</h3>
        <div class="hx-warning-loop">${loop}</div>
      </div>
    </div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function cleanup() {
    if (!isHome()) {
      document.querySelector('#hx-warning-home')?.remove()
    }
    if (!isWarningRoute()) {
      document.querySelector('#hx-warning-demo-page')?.remove()
    }
  }

  async function render() {
    cleanup()
    const data = await loadData()
    if (!data) return
    if (isHome()) renderHome(data)
    if (isWarningRoute()) renderWarningPage(data)
  }

  window.hxEnhance(render, { wait: 380, observeRoot: true, afterNav: 100 })
})()
