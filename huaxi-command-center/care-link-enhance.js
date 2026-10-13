/**
 * 床 / 患者 / 设备：医生一条工具栏互跳（读 care-bindings + scenario 占用床）
 */
;(function () {
  /** @type {{ list: object[], byBed: Map<string, object>, byPatient: Map<string, object>, byDevice: Map<string, object> } | null} */
  let index = null
  let loadPromise = null

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function hashQuery() {
    const raw = location.hash.replace(/^#/, '')
    const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
    return new URLSearchParams(q)
  }

  function normalize(row) {
    const bedLabel = row.bedLabel || row.label || '床位'
    return {
      scope: row.scope || '',
      bedId: row.bedId,
      bedLabel,
      patientId: row.patientId,
      patientName: row.patientName || row.patientId,
      deviceId: row.deviceId || (row.bedId ? `MON-${row.bedId}` : ''),
      deviceName: row.deviceName || '床旁设备',
    }
  }

  function mergeBindings(apiRows, state) {
    const byBed = new Map()
    for (const row of apiRows || []) {
      if (!row.bedId || !row.patientId) continue
      byBed.set(row.bedId, normalize(row))
    }
    const patients = state?.patients || []
    for (const bed of state?.beds || []) {
      if (bed.status !== 'occupied' || !bed.patientId) continue
      if (byBed.has(bed.id)) continue
      const pat = patients.find((p) => p.id === bed.patientId)
      byBed.set(bed.id, normalize({
        scope: '在院床位',
        bedId: bed.id,
        bedLabel: bed.label || bed.id,
        patientId: bed.patientId,
        patientName: pat?.name || bed.patientId,
        deviceId: `MON-${bed.id}`,
        deviceName: '监护仪',
      }))
    }
    const list = [...byBed.values()]
    const byPatient = new Map()
    const byDevice = new Map()
    for (const b of list) {
      byPatient.set(b.patientId, b)
      if (b.deviceId) byDevice.set(b.deviceId, b)
    }
    return { list, byBed, byPatient, byDevice }
  }

  function loadIndex() {
    if (index) return Promise.resolve(index)
    if (loadPromise) return loadPromise
    loadPromise = Promise.all([
      fetch('/api/care-bindings.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { bindings: [] })),
      fetch('/scenario.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { state: {} })),
    ])
      .then(([care, scen]) => {
        index = mergeBindings(care.bindings, scen.state || scen)
        return index
      })
      .catch(() => {
        index = mergeBindings([], {})
        return index
      })
    return loadPromise
  }

  function findBind() {
    if (!index) return null
    const p = path()
    const bed = p.match(/^\/bed\/([^/]+)/)
    if (bed) return index.byBed.get(decodeURIComponent(bed[1])) || null
    const pat = p.match(/^\/patient\/([^/]+)/)
    if (pat) return index.byPatient.get(decodeURIComponent(pat[1])) || null
    const qBed = hashQuery().get('bed')
    if (qBed) return index.byBed.get(qBed) || null
    return null
  }

  function stripHtml(bind, mode) {
    const bedHref = `/#/bed/${encodeURIComponent(bind.bedId)}`
    const patHref = `/#/patient/${encodeURIComponent(bind.patientId)}`
    const devHref = `/#/devices?bed=${encodeURIComponent(bind.bedId)}`
    const back =
      mode === 'bed'
        ? `<a class="hx-back" href="/#/beds">返回科室床位</a>`
        : mode === 'patient'
          ? `<a class="hx-back" href="${bedHref}">返回 ${bind.bedLabel}</a>`
          : mode === 'devices'
            ? `<a class="hx-back" href="${bedHref}">返回 ${bind.bedLabel}</a>`
            : `<a class="hx-back" href="/#/critical">返回重症监护</a>`
    return `<div class="hx-strip">
      ${back}
      <a href="${patHref}">${bind.patientName}</a>
      <a href="${bedHref}">${bind.bedLabel}</a>
      <a href="${devHref}">床旁设备</a>
      <span class="hx-slot">床旁画面未接</span>
    </div>`
  }

  function devicesStrip(idx) {
    const qBed = hashQuery().get('bed')
    const bind = qBed ? idx.byBed.get(qBed) : null
    if (bind) return stripHtml(bind, 'devices')
    if (idx.list.length <= 6) {
      const links = idx.list
        .slice(0, 8)
        .map(
          (b) =>
            `<a href="/#/bed/${encodeURIComponent(b.bedId)}">${b.bedLabel} · ${b.patientName}</a>`,
        )
        .join('')
      return `<div class="hx-strip">
        <a class="hx-back" href="/#/critical">返回重症监护</a>
        ${links}
      </div>`
    }
    return `<div class="hx-strip">
      <a class="hx-back" href="/#/critical">返回重症监护</a>
      <a href="/#/beds">从科室床位选择</a>
      <span class="hx-slot">已绑定 ${idx.list.length} 张床，请从床位进入</span>
    </div>`
  }

  function mount(host, id, html, mode) {
    if (!host) return
    let box = document.getElementById(id)
    if (box && box.parentElement !== host) {
      box.remove()
      box = null
    }
    if (!box) {
      box = document.createElement('div')
      box.id = id
      box.className = 'hx-care-dock'
      if (mode === 'after') host.insertAdjacentElement('afterend', box)
      else host.insertBefore(box, host.firstChild)
    }
    if (box.dataset.html === html) return
    box.dataset.html = html
    box.innerHTML = html
  }

  function render() {
    const p = path()
    const onCare =
      p.startsWith('/bed/') || p.startsWith('/patient/') || p === '/devices' || p === '/beds' || p === '/critical' || p.startsWith('/critical')
    if (!onCare) {
      document.querySelectorAll('.hx-care-dock').forEach((n) => n.remove())
      return
    }

    loadIndex().then((idx) => {
      const bind = findBind()

      if (p.startsWith('/bed/') && document.querySelector('.single-bed')) {
        const host = document.querySelector('.single-bed aside') || document.querySelector('.single-bed')
        const bedId = decodeURIComponent((p.match(/^\/bed\/([^/]+)/) || [])[1] || '')
        const html = bind
          ? stripHtml(bind, 'bed')
          : `<div class="hx-strip">
              <a class="hx-back" href="/#/beds">返回科室床位</a>
              <a href="/#/devices?bed=${encodeURIComponent(bedId)}">床旁设备</a>
              <span class="hx-slot">床旁画面未接</span>
            </div>`
        mount(host, 'hx-dock-bed', html)
        return
      }

      if (p.startsWith('/patient/') && document.querySelector('.patient-identity')) {
        const host = document.querySelector('.patient-identity')?.parentElement || document.querySelector('main')
        const html = bind
          ? stripHtml(bind, 'patient')
          : `<div class="hx-strip"><a class="hx-back" href="/#/patients">返回患者列表</a></div>`
        mount(host, 'hx-dock-patient', html)
        return
      }

      if (p === '/devices' && document.querySelector('.workspace')) {
        mount(document.querySelector('.workspace'), 'hx-dock-devices', devicesStrip(idx))
        return
      }

      document.querySelectorAll('.hx-care-dock').forEach((n) => {
        if (!['hx-dock-bed', 'hx-dock-patient', 'hx-dock-devices'].includes(n.id)) n.remove()
      })
    })
  }

  window.addEventListener('hashchange', () => {
    index = null
    loadPromise = null
    document.querySelectorAll('.hx-care-dock').forEach((n) => {
      n.dataset.html = ''
    })
  })

  window.hxEnhance(render, { wait: 350, observeRoot: true, afterNav: 60 })
})()
