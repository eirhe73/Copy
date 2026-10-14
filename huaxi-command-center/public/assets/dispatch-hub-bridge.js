/**
 * 主站 #/dispatch 默认留在指挥中枢本页（app.html 里的急救调度）。
 * 仅当 ?hub=1 或 localStorage huaxi-dispatch-hub=1 时，才跳到 /dispatch.html。
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function hashQuery() {
    const raw = location.hash.replace(/^#/, '')
    return new URLSearchParams(raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '')
  }

  function hubOptIn() {
    if (hashQuery().get('hub') === '1') return true
    try {
      return localStorage.getItem('huaxi-dispatch-hub') === '1'
    } catch {
      return false
    }
  }

  function redirectToHub() {
    if (!hubOptIn()) return
    const p = path()
    const isOldDispatch = p === '/dispatch'
    const isWrongHtmlHash = p === '/dispatch.html'
    if (!isOldDispatch && !isWrongHtmlHash) return

    const q = hashQuery()
    const hub = q.get('hub')
    if (hub === 'ambulances') {
      location.replace('/dispatch.html#ambulances')
      return
    }
    const qs = q.toString()
    location.replace(qs ? `/dispatch.html#live?${qs}` : '/dispatch.html#live')
  }

  function mount() {
    document.getElementById('huaxi-dispatch-subnav')?.remove()
    redirectToHub()
  }

  window.addEventListener('hashchange', mount)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
})()
