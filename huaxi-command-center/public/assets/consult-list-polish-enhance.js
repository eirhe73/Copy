/**
 * 远程会诊列表页：科室待接诊队列卡片化、接诊操作区结构化（不改 React 业务逻辑）
 */
;(function () {
  let uid = 0

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isConsultList() {
    return path() === '/consultations'
  }

  function wrapQueueList(section) {
    let list = section.querySelector('.hx-consult-queue-list')
    const loose = [...section.querySelectorAll(':scope > article')]
    if (!list) {
      if (!loose.length) return
      list = document.createElement('div')
      list.className = 'hx-consult-queue-list'
      loose[0].insertAdjacentElement('beforebegin', list)
      loose.forEach((a) => list.appendChild(a))
      return
    }
    loose.forEach((a) => list.appendChild(a))
  }

  function polishArticle(art) {
    art.classList.add('hx-consult-queue-card')
    if (art.querySelector('.hx-consult-admit-actions')) return

    const sel = art.querySelector('select')
    const btn = art.querySelector('button.primary')
    if (!sel && !btn) return

    const smalls = [...art.querySelectorAll(':scope > small')]
    const applicant = smalls[smalls.length - 1]
    if (applicant) applicant.classList.add('hx-consult-applicant')

    const wrap = document.createElement('div')
    wrap.className = 'hx-consult-admit-actions'

    const insertBeforeNode = sel || btn
    if (!insertBeforeNode || !insertBeforeNode.parentElement) return

    if (sel) {
      const label = document.createElement('label')
      label.className = 'hx-consult-admit-label'
      label.textContent = '接诊医生'
      if (!sel.id) {
        uid += 1
        sel.id = `hx-consult-doc-${uid}`
      }
      label.setAttribute('for', sel.id)
      wrap.appendChild(label)
    }

    // 先把 wrap 插进 article，再移入控件（原先先移 select 会导致 wrap 挂到 detached 子树，按钮点不动）
    art.insertBefore(wrap, insertBeforeNode)
    if (sel) wrap.appendChild(sel)
    if (btn) wrap.appendChild(btn)
  }

  function render() {
    const on = isConsultList()
    document.body.classList.toggle('hx-consult-page', on)
    if (!on) return

    const main = document.querySelector('main.workspace')
    main?.classList.toggle('hx-consult-workspace', true)

    document.querySelectorAll('.consultation-queue').forEach((section) => {
      section.querySelectorAll('article').forEach(polishArticle)
      wrapQueueList(section)
    })
  }

  window.hxEnhance(render, { wait: 280, observeRoot: true, afterNav: 80 })
})()
