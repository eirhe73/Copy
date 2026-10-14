/**
 * 远程会诊页上下文：
 * - 「返回指挥中枢 / 返回实时出警」按钮固定放到顶部子导航（nav.subnav）右侧，
 *   不再注入工作区内部（避免挤压内容、随页面滚动错位）。
 * - 带 task/plate 参数进入时，任务上下文元信息仍保留在工作区顶部。
 * - 全县会诊队列横幅见 renderRemoteBanner；基层上转会诊见 grassroots-consult-enhance.js
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

  /** 把返回按钮挂到子导航最右侧（margin-left:auto 由样式控制） */
  function ensureNavBack(label, href) {
    const subnav = document.querySelector('nav.subnav')
    if (!subnav) return
    let el = document.getElementById('hx-nav-back')
    if (!el) {
      el = document.createElement('a')
      el.id = 'hx-nav-back'
      el.className = 'hx-nav-back'
      subnav.appendChild(el)
    }
    const abs = (() => {
      try {
        return new URL(href, location.origin).href
      } catch {
        return href
      }
    })()
    if (el.getAttribute('href') !== abs) el.setAttribute('href', abs)
    if (el.textContent !== label) el.textContent = label
  }

  function removeNavBack() {
    document.getElementById('hx-nav-back')?.remove()
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
      removeNavBack()
      return
    }
    const q = query()
    const task = q.get('task') || ''
    const plate = q.get('plate') || ''
    const complaint = q.get('complaint') || ''

    const back = task || plate ? '/dispatch.html#live' : '/#/'
    const backLabel = task || plate ? '返回实时出警' : '返回指挥中枢'
    ensureNavBack(backLabel, back)

    if (!task && !plate) {
      // 普通入口：无需任务上下文条
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
    const html = `<div class="hx-strip"><span class="hx-care-meta">任务 ${esc(task || '—')} · ${esc(plate)} · ${esc(complaint)}</span></div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function render() {
    if (path() !== '/consultations') {
      document.getElementById('hx-consult-context')?.remove()
      document.getElementById('hx-consult-mode')?.remove()
      removeNavBack()
      return
    }
    renderRemoteBanner()
    renderDispatchStrip()
  }

  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 80 })
})()
