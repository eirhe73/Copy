/**
 * 基层医声 Dr：连续播放并入播放列表标题栏
 */
;(function () {
  function enhanceContinuousPlayback() {
    if (!document.querySelector('.dr-page')) return

    const label = document.querySelector('.dr-page label.dr-continuous:not([data-dr-placed])')
    const head = document.querySelector('.dr-page .dr-playlist .dr-pl-head')
    if (!label || !head) return

    const wrap = label.parentElement
    head.appendChild(label)
    label.classList.add('dr-continuous--in-head')
    label.setAttribute('data-dr-placed', '1')

    if (wrap && wrap !== head && wrap.childElementCount === 0) wrap.remove()
  }

  function markVideoView() {
    if (!location.hash.includes('/dr')) return
    const q = new URLSearchParams(location.hash.split('?')[1] || '')
    const view = q.get('view')
    if (view && view !== 'videos') return
    const page = document.querySelector('.dr-page')
    if (!page || page.querySelector('.hx-dr-video-label')) return
    const tag = document.createElement('p')
    tag.className = 'hx-dr-video-label hx-ia-view-head'
    tag.innerHTML = '<strong>视频展示</strong><span>基层医生 Dr. · 演示播放列表</span>'
    page.insertBefore(tag, page.firstChild)
  }

  function tick() {
    enhanceContinuousPlayback()
    markVideoView()
  }

  window.hxEnhance(tick, { wait: 400, observeRoot: true, afterNav: 80 })
})()
