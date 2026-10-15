/**
 * 主站 /#/devices：说明「本地绑定已保存，设备连接状态未改变」为演示设计；标注已绑行
 */
;(function () {
  const STORAGE_KEY = 'huaxi-demo-device-bindings'

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function loadMap() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function mountHint() {
    const main = document.querySelector('main.workspace')
    if (!main) return
    let box = document.getElementById('hx-device-bind-hint')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-device-bind-hint'
      box.className = 'hx-device-bind-hint'
      const anchor = main.querySelector('.filter-bar') || main.querySelector('.business-table') || main.querySelector('h1')?.parentElement
      if (anchor) anchor.insertAdjacentElement('beforebegin', box)
      else main.insertBefore(box, main.firstChild)
    }
    box.innerHTML = `<p><strong>如何绑床</strong>：在表格「操作」列点 <strong>绑定床位</strong>，在弹窗内依次选择 <strong>机构 → 科室 → 关联床位</strong>（可选责任医护），再点保存。保存后看<strong>关联床位</strong>列是否已更新。</p>
    <p class="hx-device-bind-hint__sub"><strong>演示说明</strong>：绑定只写入本机（<code>${STORAGE_KEY}</code>）；若提示「本地绑定已保存，设备连接状态未改变」属正常——<strong>采集状态 · 未连接</strong>表示未接真实物联网，不会因绑床变在线。会议交付完整台账见 <a href="/meeting-portal.html#devices">设备绑定门户</a>。</p>`
  }

  function loadMeta() {
    try {
      return JSON.parse(localStorage.getItem('huaxi-demo-device-bind-meta') || '{}')
    } catch {
      return {}
    }
  }

  function annotateRows(map) {
    const meta = loadMeta()
    document.querySelectorAll('main.workspace .business-table tbody tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td')
      if (cells.length < 7) return
      const devId = (cells[0].textContent || '').trim()
      const bedCell = cells[3]
      const m = meta[devId]
      if (m && m.bedLabel && bedCell) {
        bedCell.textContent = m.bedLabel + (m.staffName ? ` · ${m.staffName}` : '')
      }
      if (!devId || !map[devId]) {
        tr.querySelector('.hx-bind-saved')?.remove()
        return
      }
      const opCell = cells[cells.length - 1]
      const bindBtn = opCell?.querySelector('button')
      if (bindBtn && !bindBtn.dataset.hxBindHint) {
        bindBtn.dataset.hxBindHint = '1'
        bindBtn.textContent = '绑定床位…'
        bindBtn.title = '打开弹窗：选择机构、科室、床位与责任人'
      }

      const statusCell = cells[5]
      if (statusCell.querySelector('.hx-bind-saved')) return
      const span = document.createElement('span')
      span.className = 'hx-bind-saved'
      span.textContent = ' · 台账已绑（演示）'
      statusCell.appendChild(span)
      if (bedCell && !bedCell.title) {
        bedCell.title = m?.staffName
          ? `床位 ${m.bedLabel || ''} · 责任人 ${m.staffName}`
          : '绑定关系已写入 localStorage'
      }
    })
  }

  function render() {
    if (path() !== '/devices') {
      document.getElementById('hx-device-bind-hint')?.remove()
      document.querySelectorAll('.hx-bind-saved').forEach((n) => n.remove())
      return
    }
    if (!document.querySelector('main.workspace h1')?.textContent?.includes('床旁设备')) return
    mountHint()
    annotateRows(loadMap())
  }

  window.addEventListener('storage', () => render())
  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
