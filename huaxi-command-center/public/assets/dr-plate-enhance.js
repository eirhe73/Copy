/**
 * 基层医生 Dr.：顶栏五模块选中态（同 p2）、二级栏仅视频/收藏，去掉质控串台。
 */
;(function () {
  const DR_SUB = [
    ['#/dr?view=videos', '视频展示'],
    ['#/dr?view=saved', '我的收藏'],
  ]

  function hashPath() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function hashQuery() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function isDrPage() {
    return hashPath().startsWith('/dr') || !!document.querySelector('main.dr-page')
  }

  function syncMainNav() {
    const mainNav = document.querySelector('nav[aria-label="五个业务模块"]') || document.querySelector('.main-nav')
    if (!mainNav) return
    const path = hashPath()
    mainNav.querySelectorAll('a').forEach((link) => {
      const label = (link.textContent || '').replace(/\s+/g, '')
      let active = false
      if (path.startsWith('/dr') || document.querySelector('main.dr-page')) {
        active = /基层|Dr/i.test(label)
      } else if (path.startsWith('/medical-quality')) {
        active = label.includes('质控')
      } else if (path.startsWith('/warning')) {
        active = label.includes('预警')
      } else if (path.startsWith('/critical') || path === '/monitoring' || path === '/devices') {
        active = label.includes('重症') || label.includes('智慧重症')
      } else if (path.startsWith('/dispatch') || ['/patients', '/register', '/consultations', '/transfers'].some((p) => path.startsWith(p))) {
        active = label.includes('急救') || label.includes('调度')
      }
      link.classList.toggle('active', active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  }

  function fixSubnav() {
    const sub = document.querySelector('nav.subnav')
    if (!sub) return

    if (!isDrPage()) {
      document.body.classList.remove('hx-plate-dr')
      sub.querySelectorAll('a[data-hx-dr-sub]').forEach((el) => el.remove())
      sub.querySelectorAll('a[data-hx-dr-hidden]').forEach((el) => {
        el.removeAttribute('data-hx-dr-hidden')
        el.style.removeProperty('display')
      })
      return
    }

    document.body.classList.add('hx-plate-dr')
    const view = hashQuery().get('view') || 'videos'

    sub.querySelectorAll(':scope > a').forEach((a, idx) => {
      if (idx === 0) return
      const label = (a.textContent || '').trim()
      const href = a.getAttribute('href') || ''
      const isQc = label.includes('质控') || href.includes('medical-quality')
      const isDrNative = href.includes('/dr') && !a.dataset.hxDrSub
      if (isQc || isDrNative || (!a.dataset.hxDrSub && label !== '视频展示' && label !== '我的收藏')) {
        a.dataset.hxDrHidden = '1'
        a.style.setProperty('display', 'none', 'important')
      }
    })

    DR_SUB.forEach(([href, label]) => {
      let a = sub.querySelector(`a[data-hx-dr-sub="${label}"]`)
      if (!a) {
        a = document.createElement('a')
        a.dataset.hxDrSub = label
        sub.appendChild(a)
      }
      a.href = href
      a.textContent = label
      a.style.removeProperty('display')
      const active =
        (label === '视频展示' && (view === 'videos' || view === 'sop' || view === 'drugs' || !hashQuery().get('view'))) ||
        (label === '我的收藏' && view === 'saved')
      a.classList.toggle('active', active)
    })
  }

  function tick() {
    syncMainNav()
    fixSubnav()
  }

  document.addEventListener(
    'click',
    (e) => {
      if (!isDrPage()) return
      const a = e.target instanceof Element ? e.target.closest('nav.subnav > a') : null
      if (!a) return
      const label = (a.textContent || '').trim()
      if (label.includes('质控') || (a.getAttribute('href') || '').includes('medical-quality')) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    true,
  )

  window.hxEnhance(tick, { wait: 80, afterNav: 40 })
  window.addEventListener('hashchange', tick)
  let n = 0
  const burst = setInterval(() => {
    tick()
    n += 1
    if (n >= 15) clearInterval(burst)
  }, 250)
})()
