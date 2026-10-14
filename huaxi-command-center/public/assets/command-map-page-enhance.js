/**
 * 侧栏一体化：#/map 为首页 3D 地图独立整页（仍用 React 首页 WebGL，非 gis-command.html）
 */
;(function () {
  const FLAG = 'hx-page-map-only'
  let pendingMap = false

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function mapOnlyActive() {
    return document.body.classList.contains(FLAG)
  }

  function setMapOnly(on) {
    document.body.classList.toggle(FLAG, on)
    window.dispatchEvent(new CustomEvent('hx-map-page', { detail: { active: on } }))
    if (on) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'))
        setTimeout(() => window.dispatchEvent(new Event('resize')), 120)
      })
    }
  }

  function syncUrlDisplay() {
    if (!mapOnlyActive()) return
    const want = `${location.pathname}${location.search}#/map`
    if (location.hash !== '#/map') {
      try {
        history.replaceState(history.state, '', want)
      } catch {
        location.hash = '#/map'
      }
    }
  }

  function ensureHomeThenMap() {
    const dash = document.querySelector('main.dashboard.screen, main.dashboard')
    if (dash) {
      setMapOnly(true)
      syncUrlDisplay()
      pendingMap = false
      return
    }
    if (path() !== '/') {
      location.hash = '#/'
      return
    }
    window.hxEnhance?.(
      () => {
        if (pendingMap || path() === '/map') ensureHomeThenMap()
      },
      { wait: 200, afterNav: 150 },
    )
  }

  function applyRoute() {
    const p = path()
    if (p === '/map') {
      pendingMap = true
      ensureHomeThenMap()
      return
    }

    if (p === '/' && pendingMap) {
      ensureHomeThenMap()
      return
    }

    pendingMap = false
    if (p === '/') {
      setMapOnly(false)
      return
    }

    setMapOnly(false)
  }

  window.hxMapPage = {
    isActive: () => mapOnlyActive() || path() === '/map',
  }

  window.addEventListener('hashchange', applyRoute)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyRoute)
  else applyRoute()
  window.hxEnhance?.(applyRoute, { wait: 280, observeRoot: true, afterNav: 120 })
})()
