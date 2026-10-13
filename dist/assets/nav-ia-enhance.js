/**
 * 医生视角：院前四页进同一工作台；会诊 / 转诊 / 协同仍走主站。
 */
;(function () {
  const DISPATCH_KEEP = ['实时出警', '急救事件', '救护车列表', '患者登记', '远程会诊', '转诊交接', '任务协同']
  const DISPATCH_GO = {
    实时出警: '/dispatch.html#live',
    急救事件: '/dispatch.html#events',
    患者登记: '/dispatch.html#register',
    救护车列表: '/dispatch.html#ambulances',
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
      /* 院内早期预警：预警总览、科室全景、重点关注、科室床位、预警通知、运行统计 — 全部保留 */
      items.forEach((a) => setHidden(a, false))
      return
    }

    /* 县域智慧重症：重症监护、床位全景、乡镇监护、视频监控、床旁设备、五大中心、协作机构 — 全部保留 */
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
      const dest = DISPATCH_GO[text(a)]
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
