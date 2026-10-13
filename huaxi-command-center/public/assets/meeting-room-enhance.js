/**
 * L · 会诊房间页：统一「演示 · 媒体占位」提示（bundle 内 WebRTC 占位）
 */
;(function () {
  const BADGE = '演示环境 · 音视频为占位，非商用 RTC'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function render() {
    const p = path()
    const inRoom = p.startsWith('/room/') || p.startsWith('/join/') || p.startsWith('/consultation/')
    if (!inRoom) {
      document.getElementById('hx-meeting-demo-badge')?.remove()
      return
    }
    const host = document.querySelector('main.meeting header') || document.querySelector('main.meeting')
    if (!host) return
    let el = document.getElementById('hx-meeting-demo-badge')
    if (!el) {
      el = document.createElement('p')
      el.id = 'hx-meeting-demo-badge'
      el.className = 'hx-meeting-demo-badge'
      const anchor = host.querySelector('header') || host
      anchor.appendChild(el)
    }
    if (el.textContent !== BADGE) el.textContent = BADGE
  }

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
