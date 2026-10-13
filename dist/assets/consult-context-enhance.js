;(function () {
  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function query() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function render() {
    if (path() !== '/consultations') {
      document.getElementById('hx-consult-context')?.remove()
      return
    }
    const q = query()
    const task = q.get('task') || ''
    const plate = q.get('plate') || ''
    const complaint = q.get('complaint') || ''
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
    const back = task || plate ? '/dispatch.html#live' : '/#/'
    const backLabel = task || plate ? '返回实时出警' : '返回指挥中枢'
    const html = `<div class="hx-strip">
      <a class="hx-back" href="${back}">${backLabel}</a>
      ${task || plate ? `<span>任务 ${task || '—'} · ${plate || ''} · ${complaint || ''}</span>` : ''}
    </div>`
    if (box.dataset.body === html) return
    box.dataset.body = html
    box.innerHTML = html
  }

  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 80 })
})()
