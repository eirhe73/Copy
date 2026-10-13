/**
 * H · 基层调度演示链：威远 → 会诊 → 转诊（会诊 / 转诊页顶栏）
 */
;(function () {
  /** @type {{ title: string, notice: string, steps: object[] } | null} */
  let story = null
  let loadPromise = null

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function loadStory() {
    if (story) return Promise.resolve(story)
    if (loadPromise) return loadPromise
    loadPromise = fetch('/api/grassroots-demo.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        story = data && Array.isArray(data.steps) ? data : null
        return story
      })
      .catch(() => {
        story = null
        return story
      })
    return loadPromise
  }

  function activeStepId(p) {
    if (p === '/transfers') return 'transfer'
    if (p === '/consultations') return 'consult'
    return ''
  }

  function storyHtml(data, activeId) {
    const steps = data.steps
      .map((s, idx) => {
        const active = s.id === activeId ? ' is-active' : ''
        const gis = s.gisHref
          ? `<a class="hx-grassroots-gis" href="${s.gisHref}" title="GIS 协同节点">GIS</a>`
          : ''
        return `<li class="hx-grassroots-step${active}">
          <span class="hx-grassroots-n">${idx + 1}</span>
          <div class="hx-grassroots-body">
            <a href="${s.href}"><strong>${s.label}</strong><em>${s.detail || ''}</em></a>
            ${gis}
          </div>
        </li>`
      })
      .join('')
    return `<section class="hx-grassroots-story" aria-label="${data.title}">
      <header>
        <strong>${data.title}</strong>
        <span>${data.notice || ''}</span>
      </header>
      <ol class="hx-grassroots-steps">${steps}</ol>
    </section>`
  }

  function mount(host, html) {
    if (!host) return
    let box = document.getElementById('hx-grassroots-story')
    if (box && box.parentElement !== host) {
      box.remove()
      box = null
    }
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-grassroots-story'
      const anchor =
        host.querySelector('.transfer-process') ||
        host.querySelector('.consultation-grid') ||
        host.querySelector('.workspace-heading') ||
        host.firstElementChild
      if (anchor) anchor.insertAdjacentElement('beforebegin', box)
      else host.insertBefore(box, host.firstChild)
    }
    if (box.dataset.html === html) return
    box.dataset.html = html
    box.innerHTML = html
  }

  function highlightTransfers(demo) {
    if (path() !== '/transfers' || !demo?.transferDemo?.patientName) return
    const name = demo.transferDemo.patientName
    document.querySelectorAll('.business-table tbody tr, .center-patient-table tbody tr, table tbody tr').forEach((row) => {
      if (!(row.textContent || '').includes(name)) return
      row.classList.add('hx-transfer-demo-row')
      if (row.querySelector('.hx-transfer-demo-badge')) return
      const cell = row.querySelector('td')
      if (!cell) return
      const badge = document.createElement('span')
      badge.className = 'hx-transfer-demo-badge'
      badge.textContent = demo.transferDemo.badge || '演示转诊'
      cell.insertAdjacentElement('afterbegin', badge)
    })
  }

  function render() {
    const p = path()
    if (p !== '/consultations' && p !== '/transfers') {
      document.getElementById('hx-grassroots-story')?.remove()
      document.querySelectorAll('.hx-transfer-demo-row').forEach((r) => {
        r.classList.remove('hx-transfer-demo-row')
        r.querySelector('.hx-transfer-demo-badge')?.remove()
      })
      return
    }
    const host = document.querySelector('main.workspace') || document.querySelector('.workspace') || document.querySelector('main')
    if (!host) return
    loadStory().then((data) => {
      if (!data) return
      mount(host, storyHtml(data, activeStepId(p)))
      highlightTransfers(data)
    })
  }

  window.hxEnhance(render, { wait: 380, observeRoot: true, afterNav: 80 })
})()
