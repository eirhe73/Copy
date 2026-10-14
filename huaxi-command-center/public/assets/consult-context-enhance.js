/**
 * 远程会诊页：院前 task/plate 上下文条；基层会诊见 grassroots-consult-enhance.js
 */
;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function query() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function renderRemoteBanner() {
    if (path() !== '/consultations' || query().get('scope') === 'grassroots') {
      document.getElementById('hx-consult-mode')?.remove()
      return
    }
    const host =
      document.querySelector('main.workspace .workspace-heading') ||
      document.querySelector('main.workspace')
    if (!host) return
    let box = document.getElementById('hx-consult-mode')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-consult-mode'
      box.className = 'hx-consult-mode'
      host.insertAdjacentElement('afterend', box)
    }
    const html = `<p class="hx-consult-mode__text">全县会诊队列，含院前、县域及上级医院接诊。</p>
      <a class="hx-consult-mode__link" href="/#/consultations?scope=grassroots">基层上转会诊</a>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function renderDispatchStrip() {
    if (path() !== '/consultations' || query().get('scope') === 'grassroots') {
      document.getElementById('hx-consult-context')?.remove()
      return
    }
    const q = query()
    const task = q.get('task') || ''
    const plate = q.get('plate') || ''
    const complaint = q.get('complaint') || ''
    if (!task && !plate) {
      document.getElementById('hx-consult-context')?.remove()
      return
    }
    const host = document.querySelector('.workspace') || document.querySelector('main')
    if (!host) return
    let box = document.getElementById('hx-consult-context')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-consult-context'
      box.className = 'hx-care-dock'
      const anchor = host.querySelector('.workspace-heading, h1')
      if (anchor && anchor.parentElement) anchor.parentElement.insertAdjacentElement('afterend', box)
      else host.insertBefore(box, host.firstChild)
    }
    const html = `<div class="hx-strip">
      <a class="hx-back" href="/dispatch.html#live">返回实时出警</a>
      <span>任务 ${esc(task || '—')} · ${esc(plate)} · ${esc(complaint)}</span>
    </div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function render() {
    if (path() !== '/consultations') {
      document.getElementById('hx-consult-context')?.remove()
      document.getElementById('hx-consult-mode')?.remove()
      return
    }
    renderRemoteBanner()
    renderDispatchStrip()
  }

  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 80 })
})()
