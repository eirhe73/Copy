/**
 * 主站 app.html SPA：院前四页走 hash 路由，不跳 dispatch.html（除非 legacy）
 */
;(function () {
  function legacyMode() {
    try {
      if (localStorage.getItem('huaxi-dispatch-legacy') === '1') return true
    } catch {
      /* ignore */
    }
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q).get('legacy') === '1'
  }

  function integratedSpa() {
    if (legacyMode()) return false
    try {
      if (localStorage.getItem('huaxi-integrated-nav') === '1') return true
    } catch {
      /* ignore */
    }
    if (document.body.classList.contains('hx-sidebar-shell')) return true
    const path = (location.pathname || '').replace(/\\/g, '/')
    if (path.endsWith('/dispatch.html')) return false
    if (document.getElementById('root')) return true
    return false
  }

  window.hxIntegratedNav = { integratedSpa, legacyMode }

  if (document.getElementById('root') && !legacyMode()) {
    try {
      localStorage.setItem('huaxi-integrated-nav', '1')
    } catch {
      /* ignore */
    }
  }
})()
