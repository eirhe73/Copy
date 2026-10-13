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
    box.innerHTML = `<p><strong>演示说明</strong>：「绑定床位」只把<strong>设备 ↔ 床位</strong>写入本机（<code>${STORAGE_KEY}</code>），保存后会出现提示「本地绑定已保存，设备连接状态未改变」——这是<strong>正常现象</strong>：「采集状态 · 未连接」表示未接真实物联网/监护采集，不会因绑床变在线。请看<strong>关联床位</strong>列是否已变；完整台账改绑见 <a href="/meeting-portal.html#devices">会议交付 · 设备绑定</a>。</p>`
  }

  function annotateRows(map) {
    document.querySelectorAll('main.workspace .business-table tbody tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td')
      if (cells.length < 5) return
      const devId = (cells[0].textContent || '').trim()
      if (!devId || !map[devId]) {
        tr.querySelector('.hx-bind-saved')?.remove()
        return
      }
      const statusCell = cells[4]
      if (statusCell.querySelector('.hx-bind-saved')) return
      const span = document.createElement('span')
      span.className = 'hx-bind-saved'
      span.textContent = ' · 台账已绑（演示）'
      statusCell.appendChild(span)
      const bedCell = cells[3]
      if (bedCell && !bedCell.title) bedCell.title = '绑定关系已写入 localStorage'
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

  window.hxEnhance(render, { wait: 400, observeRoot: true, afterNav: 100 })
})()
