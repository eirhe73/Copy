/**
 * L · 全站演示免责声明（主站子页底栏，与 dispatch / GIS 文案一致）
 */
;(function () {
  const FOOT =
    '演示数据 · 非实时 HIS / 120 · 非临床统计（Mock），正式环境对接院方接口。'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isHome() {
    const p = path()
    return p === '/' || p === ''
  }

  function render() {
    if (isHome() || !document.querySelector('.app-shell')) {
      document.getElementById('hx-global-demo-foot')?.remove()
      document.body.classList.remove('hx-has-demo-foot')
      return
    }
    let foot = document.getElementById('hx-global-demo-foot')
    if (!foot) {
      foot = document.createElement('footer')
      foot.id = 'hx-global-demo-foot'
      foot.className = 'hx-global-demo-foot'
      foot.setAttribute('role', 'contentinfo')
      document.body.appendChild(foot)
    }
    if (foot.textContent !== FOOT) foot.textContent = FOOT
    document.body.classList.add('hx-has-demo-foot')
  }

  window.hxEnhance(render, { wait: 300, observeRoot: true, afterNav: 60 })
})()
