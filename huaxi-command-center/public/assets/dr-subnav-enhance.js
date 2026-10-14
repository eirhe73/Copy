/**
 * 基层医声 Dr：左侧子导航（nav.subnav）替换为三大板块
 * 原 bundle 中 vpe 用 Qn,{line:3} 兜底，导致 /dr 页面 subnav 错显「质控整改看板/质控统计」。
 * 本脚本在 /dr 路由下将 subnav 的子链接重写为内容区三大板块（标签动态取自 dr-mainnav，保证一致），
 * 点击联动 dr-mainnav 对应按钮切换板块，并双向同步高亮。
 */
;(function () {
  var SEC_IDS = ['skills', 'sop', 'drugs']
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  /** 动态读取内容区三大板块（顺序即 UF 顺序），标签与 dr-mainnav 按钮完全一致 */
  function collectSections() {
    var btns = Array.prototype.slice.call(document.querySelectorAll('.dr-mainnav button'))
    if (!btns.length) return null
    return btns.map(function (b, i) {
      return { id: SEC_IDS[i] || 'sec' + i, label: (b.textContent || '').trim() }
    })
  }

  function activeLabel() {
    var btn = document.querySelector('.dr-mainnav button.active')
    if (btn) return (btn.textContent || '').trim()
    var secs = collectSections()
    if (secs) {
      for (var i = 0; i < secs.length; i++) {
        var el = document.getElementById(secs[i].id)
        if (el && el.style.display !== 'none') return secs[i].label
      }
    }
    return ''
  }

  /** 就地重写 subnav：保留返回按钮，移除其余原链接，补齐三大板块 */
  function build(nav, secs) {
    var kids = Array.prototype.slice.call(nav.children)
    var home = null
    kids.forEach(function (a) {
      if (a.tagName !== 'A') return
      if ((a.getAttribute('title') || '') === '返回指挥中心') home = a
      else a.remove()
    })
    if (!home) home = nav.querySelector('a[href="#/"]')
    if (!home) return
    var custom = nav.querySelectorAll('a[data-dr-sec]')
    if (custom.length !== secs.length) {
      custom.forEach(function (a) { a.remove() })
      secs.forEach(function (sec) {
        var a = document.createElement('a')
        a.setAttribute('data-dr-sec', sec.id)
        a.setAttribute('href', '#/dr?view=' + sec.id)
        a.textContent = sec.label
        nav.appendChild(a)
      })
    }
  }

  function syncActive(nav) {
    var cur = activeLabel()
    nav.querySelectorAll('a[data-dr-sec]').forEach(function (a) {
      var on = (a.textContent || '').trim() === cur
      if (on !== a.classList.contains('active')) a.classList.toggle('active', on)
    })
  }

  function apply() {
    if (path() !== '/dr') return
    if (!document.querySelector('.dr-page')) return
    var nav = document.querySelector('nav.subnav')
    if (!nav) return
    var secs = collectSections()
    if (!secs) return
    var before = nav.querySelectorAll('a[data-dr-sec]').length
    build(nav, secs)
    syncActive(nav)
    return before !== secs.length
  }

  // 点击 subnav 板块项 → 联动 dr-mainnav 按钮切换（复用 React 内部 te() 逻辑）
  document.addEventListener(
    'click',
    function (ev) {
      var node = ev.target
      if (!(node instanceof Element)) return
      var a = node.closest('nav.subnav > a[data-dr-sec]')
      if (!a) return
      if (path() !== '/dr') return
      ev.preventDefault()
      ev.stopPropagation()
      var label = (a.textContent || '').trim()
      var btn = Array.prototype.find.call(document.querySelectorAll('.dr-mainnav button'), function (b) {
        return (b.textContent || '').trim() === label
      })
      if (btn) btn.click()
      var nav = a.closest('nav.subnav')
      if (nav) {
        nav.querySelectorAll('a[data-dr-sec]').forEach(function (x) {
          x.classList.toggle('active', x === a)
        })
      }
    },
    true,
  )

  window.hxEnhance(apply, { wait: 300, observeRoot: true, afterNav: 100 })

  // React 每次重渲染会重建 subnav（板块切换/搜索输入等），用 MutationObserver 快速补回
  var ticking = false
  function schedule() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(function () {
      ticking = false
      apply()
    })
  }
  function startObserver() {
    var root = document.getElementById('root') || document.body
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver)
  else startObserver()
})()
