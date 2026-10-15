/**
 * 重症监护网格：占用/有视频/有绑定的床不再显示「空床」，补全患者摘要
 */
;(function () {
  let ctx = null
  let loadPromise = null

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function selectedInstitutionId() {
    const sel = document.querySelector('.critical-toolbar .segmented button.selected')
    const t = (sel?.textContent || '').trim()
    if (!t || t.includes('乡镇')) return 'weiyuan'
    if (t.includes('华西')) return 'huaxi'
    if (t.includes('内江')) return 'neijiang-first'
    if (t.includes('威远')) return 'weiyuan'
    return 'weiyuan'
  }

  function loadCtx() {
    if (ctx) return Promise.resolve(ctx)
    if (loadPromise) return loadPromise
    loadPromise = Promise.all([
      fetch('/api/care-bindings.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { bindings: [] })),
      fetch('/scenario.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([care, scen]) => {
        const state = scen.state || scen
        const patients = state.patients || []
        const beds = state.beds || []
        const byBed = new Map()
        for (const row of care.bindings || []) {
          if (row.bedId) byBed.set(row.bedId, row)
        }
        ctx = { patients, beds, byBed }
        return ctx
      })
      .catch(() => {
        ctx = { patients: [], beds: [], byBed: new Map() }
        return ctx
      })
    return loadPromise
  }

  function bedsForGrid(instId) {
    return ctx.beds.filter((b) => b.institutionId === instId && b.departmentId === 'icu')
  }

  function hasMonitorMedia(card) {
    return !!(
      card.querySelector('video[data-hx-bed-cam], video[data-hx-town-cam], .bed-mini-monitor, .video-pane video')
    )
  }

  function buildSummary(bed, bind, pat) {
    const name = pat?.name || bind?.patientName
    if (!name) return null
    const gender = pat?.gender || '—'
    const age = pat?.age != null ? `${pat.age} 岁` : '—'
    const created = pat?.createdAt
      ? new Date(pat.createdAt).toLocaleString('zh-CN', { hour12: false })
      : '—'
    const symptoms = (pat?.symptoms || []).filter(Boolean).join('、') || '—'
    const patHref = pat?.id ? `/#/patient/${encodeURIComponent(pat.id)}` : bind?.patientId ? `/#/patient/${encodeURIComponent(bind.patientId)}` : ''
    const bedHref = bed?.id ? `/#/bed/${encodeURIComponent(bed.id)}` : ''

    return `<p>患者：<b>${esc(name)}</b>，${esc(gender)}，${esc(age)}</p>
      <p>入区：${esc(created)}</p>
      <p>主诉：${esc(symptoms)}</p>
      <p>预警：暂无</p>
      <p>管床：科室医生（演示账号）</p>
      ${patHref ? `<p class="hx-bed-card-links"><a href="${esc(patHref)}">患者档案</a>${bedHref ? ` · <a href="${esc(bedHref)}">单床监护</a>` : ''}</p>` : ''}`
  }

  function syncOnce() {
    if (path() !== '/critical') return
    if (document.querySelector('.town-monitor')) return

    const grid = document.querySelector('.critical-grid')
    if (!grid) return

    loadCtx().then(() => {
      const instId = selectedInstitutionId()
      const icuBeds = bedsForGrid(instId)
      const cards = [...grid.querySelectorAll('.critical-bed')]

      cards.forEach((card, idx) => {
        const free = card.querySelector('.bed-summary .free-bed')
        if (!free) return

        const bed = icuBeds[idx]
        const bind = bed?.id ? ctx.byBed.get(bed.id) : null
        let pat = bed?.patientId ? ctx.patients.find((p) => p.id === bed.patientId) : null
        if (!pat && bind?.patientId) {
          pat = ctx.patients.find((p) => p.id === bind.patientId)
        }

        if (bed?.status === 'available' && !bed?.patientId && !pat && !bind?.patientName) return

        const shouldFill =
          pat ||
          bind?.patientName ||
          bed?.patientId ||
          bed?.status === 'occupied' ||
          bed?.status === 'reserved'
        if (!shouldFill) return

        const html = buildSummary(bed, bind, pat)
        if (!html) {
          if (hasMonitorMedia(card) && bind?.patientName) {
            free.outerHTML = `<div class="hx-bed-summary-patched"><p>患者：<b>${esc(bind.patientName)}</b></p><p>床旁远程监护中</p></div>`
          }
          return
        }

        const wrap = card.querySelector('.bed-summary')
        if (wrap) {
          wrap.innerHTML = html
          wrap.classList.add('hx-bed-summary-patched')
        }
        if (bed?.id) card.dataset.hxBedId = bed.id
      })
    })
  }

  function boot() {
    syncOnce()
    setInterval(syncOnce, 2000)
    const mo = new MutationObserver(() => syncOnce())
    mo.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', () => {
      ctx = null
      loadPromise = null
      syncOnce()
    })
  }

  boot()
})()
