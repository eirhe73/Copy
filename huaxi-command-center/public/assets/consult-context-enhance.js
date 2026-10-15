/**
 * 远程会诊页上下文：
 * - 顶栏「全县 / 基层上转」与远程会诊同一页切换（基层不再单独侧栏入口）
 * - 「返回指挥中枢 / 返回实时出警」在 nav.subnav 右侧
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

  function consultTab() {
    const q = query()
    if (q.get('scope') === 'grassroots' || q.get('tab') === 'grassroots') return 'grassroots'
    return 'all'
  }

  function migrateLegacyGrassrootsUrl() {
    if (path() !== '/consultations') return
    const q = query()
    if (q.get('scope') !== 'grassroots') return
    const next = new URLSearchParams(q)
    next.delete('scope')
    next.set('tab', 'grassroots')
    const qs = next.toString()
    location.replace(`${location.pathname}${location.search}#/consultations${qs ? `?${qs}` : ''}`)
  }

  migrateLegacyGrassrootsUrl()

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

  function isConsultModule() {
    var p = path()
    return p === '/consultations' || p.indexOf('/consultations/') === 0
  }

  function renderConsultTabs() {
    if (!isConsultModule()) {
      document.getElementById('hx-consult-mode')?.remove()
      return
    }
    // 侧栏三级 + 工作台接管：不再插页内 Tab
    if (document.body.classList.contains('hx-cw-active')) {
      document.getElementById('hx-consult-mode')?.remove()
      return
    }
    const host =
      document.querySelector('main.workspace .workspace-heading') ||
      document.querySelector('main.workspace')
    if (!host) return
    const tab = consultTab()
    let box = document.getElementById('hx-consult-mode')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-consult-mode'
      box.className = 'hx-consult-mode'
      host.insertAdjacentElement('afterend', box)
    }
    const html = `<nav class="hx-consult-tabs" aria-label="会诊范围">
      <a class="hx-consult-tab${tab === 'all' ? ' is-active' : ''}" href="/#/consultations">全县会诊</a>
      <a class="hx-consult-tab${tab === 'grassroots' ? ' is-active' : ''}" href="/#/consultations?tab=grassroots">基层上转</a>
    </nav>
    <p class="hx-consult-mode__text">${
      tab === 'grassroots'
        ? '乡镇、村卫生室发起的上转会诊，按接收医院接诊；与全县院前、县域队列同一工作台。'
        : '全县会诊队列，含院前、县域及上级医院；基层上转请切到「基层上转」。'
    }</p>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  function renderDispatchStrip() {
    if (!isConsultModule()) {
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
    if (!isConsultModule()) {
      document.getElementById('hx-consult-context')?.remove()
      document.getElementById('hx-consult-mode')?.remove()
      removeNavBack()
      return
    }
    renderConsultTabs()
    renderDispatchStrip()
  }

  window.addEventListener('hashchange', migrateLegacyGrassrootsUrl)
  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 80 })
})()
