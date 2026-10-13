/**
 * 首页面板开关：演示 / 汇报时可隐藏出警、预警、重症、地图块（默认全开）
 */
;(function () {
  const KEY = 'huaxi-home-panels'
  const DEFAULTS = { dispatch: true, warning: true, critical: true, map: true }
  const LABELS = { dispatch: '出警', warning: '预警', critical: '重症', map: '地图' }

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/') || '/'
  }

  function isHome() {
    const p = path()
    return p === '/' || p === ''
  }

  function load() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    } catch {
      return { ...DEFAULTS }
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state))
  }

  function findPanel(title) {
    return [...document.querySelectorAll('.dashboard .panel')].find((p) => {
      const t = p.querySelector('.panel-title, h2')
      return t && (t.textContent || '').includes(title)
    })
  }

  function panelNodes() {
    return {
      dispatch: [document.querySelector('.vehicle-panel'), findPanel('今日急救调度事件')],
      warning: [findPanel('24小时院内评分预警')],
      critical: [findPanel('24小时县域智慧重症事件')],
      map: [document.querySelector('.dashboard-center .main-map'), document.querySelector('.main-map')],
    }
  }

  function resetVisibility() {
    Object.values(panelNodes())
      .flat()
      .forEach((n) => {
        if (n) n.style.display = ''
      })
    const center = document.querySelector('.dashboard-center')
    if (center) center.style.display = ''
    const dash = document.querySelector('.dashboard')
    dash?.classList.remove(
      'hx-panels-no-map',
      'hx-panels-no-dispatch',
      'hx-panels-no-warning',
      'hx-panels-no-critical',
      'hx-panels-no-right',
    )
    const left = document.querySelector('.dashboard-left')
    left?.classList.remove('hx-panels-left-compact')
    const right = document.querySelector('.dashboard-right')
    if (right) {
      right.hidden = false
      right.style.removeProperty('grid-template-rows')
    }
  }

  function syncLayout(state) {
    const dash = document.querySelector('.dashboard')
    if (!dash) return
    dash.classList.toggle('hx-panels-no-map', !state.map)
    dash.classList.toggle('hx-panels-no-dispatch', !state.dispatch)
    dash.classList.toggle('hx-panels-no-warning', !state.warning)
    dash.classList.toggle('hx-panels-no-critical', !state.critical)

    const left = document.querySelector('.dashboard-left')
    if (left) left.classList.toggle('hx-panels-left-compact', !state.dispatch)

    const right = document.querySelector('.dashboard-right')
    const rightCount =
      (state.dispatch ? 1 : 0) + (state.warning ? 1 : 0) + (state.critical ? 1 : 0)
    if (right) {
      if (rightCount === 0) {
        right.hidden = true
        dash.classList.add('hx-panels-no-right')
      } else {
        right.hidden = false
        dash.classList.remove('hx-panels-no-right')
        right.style.gridTemplateRows = `repeat(${rightCount}, minmax(0, 1fr))`
      }
    }
  }

  function applyVisibility(state) {
    const map = panelNodes()
    Object.entries(map).forEach(([key, nodes]) => {
      const show = !!state[key]
      nodes.forEach((n) => {
        if (!n) return
        n.style.display = show ? '' : 'none'
      })
    })
    const center = document.querySelector('.dashboard-center')
    if (center && !state.map) center.style.display = 'none'
    else if (center) center.style.display = ''
    syncLayout(state)
  }

  function toolbar(state) {
    let bar = document.getElementById('hx-panel-toggles')
    const dash = document.querySelector('.dashboard')
    if (!dash) return
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'hx-panel-toggles'
      dash.insertBefore(bar, dash.firstChild)
    }
    bar.innerHTML = `<span class="hx-panel-toggles-label">面板</span>${Object.keys(LABELS)
      .map(
        (key) =>
          `<label><input type="checkbox" data-panel="${key}" ${state[key] ? 'checked' : ''}/>${LABELS[key]}</label>`,
      )
      .join('')}`
    bar.querySelectorAll('input[data-panel]').forEach((input) => {
      input.onchange = () => {
        const next = load()
        next[input.dataset.panel] = input.checked
        save(next)
        applyVisibility(next)
      }
    })
  }

  function hideSystemFooter() {
    document.querySelectorAll('footer.system-footer').forEach((el) => {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
      el.style.display = 'none'
    })
  }

  function render() {
    hideSystemFooter()
    if (!isHome() || !document.querySelector('.dashboard')) {
      document.getElementById('hx-panel-toggles')?.remove()
      resetVisibility()
      return
    }
    const state = load()
    toolbar(state)
    applyVisibility(state)
  }

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
