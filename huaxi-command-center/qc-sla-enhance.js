;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  const html = `
    <section class="hx-sla">
      <h2>环节时限</h2>
      <p>预警后 10 分钟到床，出警后 30 分钟到院。超时记一条。</p>
      <table>
        <thead><tr><th>环节</th><th>对象</th><th>责任人</th><th>用时</th><th>结果</th></tr></thead>
        <tbody>
          <tr><td>预警到床</td><td>ICU 1床</td><td>张医生</td><td>7 分钟</td><td>达标</td></tr>
          <tr class="over"><td>预警到床</td><td>ICU 3床</td><td>王医生</td><td>16 分钟</td><td>超时</td></tr>
          <tr><td>出警到院</td><td>演示001</td><td>张医生</td><td>18 分钟</td><td>进行中</td></tr>
          <tr class="over"><td>出警到院</td><td>演示002</td><td>王医生</td><td>38 分钟</td><td>超时</td></tr>
        </tbody>
      </table>
    </section>`

  function render() {
    if (path() !== '/medical-quality') {
      document.getElementById('hx-sla-dock')?.remove()
      return
    }
    const host = document.querySelector('.quality-workspace') || document.querySelector('main.workspace')
    if (!host) return
    let box = document.getElementById('hx-sla-dock')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-sla-dock'
      const heading = host.querySelector('.workspace-heading')
      if (heading && heading.nextSibling) host.insertBefore(box, heading.nextSibling)
      else host.insertBefore(box, host.firstChild)
    }
    if (!box.dataset.ready) {
      box.dataset.ready = '1'
      box.innerHTML = html
    }
  }

  window.addEventListener('hashchange', () => {
    const box = document.getElementById('hx-sla-dock')
    if (box) box.dataset.ready = ''
    setTimeout(render, 80)
  })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render)
  else render()
  const root = document.getElementById('root')
  if (root) new MutationObserver(() => render()).observe(root, { childList: true, subtree: true })
})()
