/**
 * 远程会诊页上下文：
 * - 「返回指挥中枢 / 返回实时出警」按钮固定放到顶部子导航（nav.subnav）右侧，
 *   不再注入工作区内部（避免挤压内容、随页面滚动错位）。
 * - 带 task/plate 参数进入时，任务上下文元信息仍保留在工作区顶部。
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

  function render() {
    if (path() !== '/consultations') {
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
      const heading = host.querySelector('.workspace-heading, h1')
      if (heading && heading.parentElement) heading.parentElement.insertAdjacentElement('afterend', box)
      else host.insertBefore(box, host.firstChild)
    }
    const html = `<div class="hx-strip"><span class="hx-care-meta">任务 ${task || '—'} · ${plate || ''} · ${complaint || ''}</span></div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 80 })
})()
