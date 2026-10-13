/**
 * 医生视角：院前四页进同一工作台；会诊 / 转诊 / 协同仍走主站。
 */
;(function () {
  const DISPATCH_KEEP = [
    '实时出警',
    '急救事件',
    '救护车列表',
    '患者登记',
    '远程会诊',
    '基层会诊',
    '医院转诊',
    '基层机构管理',
    '基层远程监护',
  ]
  const DISPATCH_GO = {
    实时出警: '/dispatch.html#live',
    急救事件: '/dispatch.html#events',
    患者登记: '/dispatch.html#register',
    救护车列表: '/dispatch.html#ambulances',
  }
  const DISPATCH_HASH = {
    '/dispatch': '/dispatch.html#live',
    '/dispatch?hub=ambulances': '/dispatch.html#ambulances',
  }

  function links(nav) {
    return [...nav.querySelectorAll(':scope > a')].filter((a) => !a.dataset.iaExtra)
  }

  function text(el) {
    return (el.textContent || '').trim()
  }

  function setHidden(el, hide) {
    if (el.hidden !== hide) el.hidden = hide
  }

  function tune(nav) {
    const items = links(nav).slice(1)
    if (!items.length) return
    const names = items.map(text)
    if (names.includes('实时出警') || names.includes('救护车列表') || names.includes('远程会诊')) {
      items.forEach((a) => {
        const label = text(a)
        setHidden(a, !DISPATCH_KEEP.includes(label))
      })
      return
    }

    if (names.includes('预警总览')) {
      items.forEach((a) => setHidden(a, false))
      return
    }

    if (names.includes('重症监护')) {
      items.forEach((a) => setHidden(a, false))
    }
  }

  document.addEventListener(
    'click',
    (event) => {
      const node = event.target
      if (!(node instanceof Element)) return
      const a = node.closest('nav.subnav > a')
      if (!a || a.dataset.iaExtra) return
      let dest = DISPATCH_GO[text(a)]
      if (!dest) {
        const href = a.getAttribute('href') || ''
        const path = href.replace(/^#\/?/, '').split('?')[0]
        const qs = href.includes('?') ? href.slice(href.indexOf('?')) : ''
        dest = DISPATCH_HASH[`${path}${qs}`] || DISPATCH_HASH[path]
      }
      if (!dest) return
      event.preventDefault()
      event.stopPropagation()
      location.href = dest
    },
    true,
  )

  let lock = false
  function apply() {
    if (lock) return
    const nav = document.querySelector('nav.subnav')
    if (!nav) return
    lock = true
    try {
      tune(nav)
    } finally {
      lock = false
    }
  }

  window.hxEnhance(apply, { wait: 400, observeRoot: true, afterNav: 100 })
})()
