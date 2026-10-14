/**
 * 独立页 #/consultations/pick：选择患者并发起远程会诊。
 */
;(function () {
  const STORE_KEY = 'huaxi-final-demo-v1'
  const CLOSED = new Set(['local-closed', 'discharged', 'service-closed'])
  const TARGET = { institutionId: 'weiyuan', departmentId: 'emergency' }
  const STAGE = {
    registered: '已登记',
    consulting: '会诊中',
    'local-closed': '当地处置结束',
    'transfer-requested': '待接收',
    accepted: '已接收',
    'in-transit': '转运中',
    admitted: '已入院',
    discharged: '已出院',
    'service-closed': '服务已结束',
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function path() {
    return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  }

  function isPickPage() {
    return path() === '/consultations/pick'
  }

  function uuid() {
    return globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2)
  }

  function loadStore() {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) throw new Error('演示数据未载入，请刷新页面')
    const pack = JSON.parse(raw)
    if (pack.version !== 1 || !Array.isArray(pack.state?.patients)) throw new Error('本地存档无效')
    return pack
  }

  function persistStore(pack) {
    const json = JSON.stringify(pack)
    localStorage.setItem(STORE_KEY, json)
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: STORE_KEY, newValue: json, storageArea: localStorage }))
    } catch (_) {}
  }

  function canSee(session, p) {
    if (session.kind === 'admin') return true
    return (
      (session.institutionId === p.institutionId && session.departmentId === p.departmentId) ||
      (p.assignedTo || []).includes(session.userId)
    )
  }

  function displayName(p) {
    const n = String(p.name || '').trim()
    if (n && n !== '患者' && !n.includes('undefined')) return n
    return p.real_name || p.patient_code || (p.id && String(p.id) !== 'undefined' ? String(p.id) : '未命名患者')
  }

  function displayId(p) {
    const id = p.id != null ? String(p.id) : ''
    if (id && id !== 'undefined') return id
    return p.patient_code ? String(p.patient_code) : '—'
  }

  function blockReason(state, session, p) {
    if (!p) return '患者不存在'
    if (!canSee(session, p)) return '无权申请'
    if (CLOSED.has(p.stage)) return '服务已结束'
    if ((state.consultationRequests || []).some((r) => r.patientId === p.id && r.status !== 'completed')) {
      return '已有进行中的会诊'
    }
    if (
      !(state.staff || []).some(
        (s) =>
          s.profession === 'doctor' &&
          s.institutionId === TARGET.institutionId &&
          s.departmentId === TARGET.departmentId,
      )
    ) {
      return '目标科室无接诊医生'
    }
    return ''
  }

  function applyConsult(pack, patientId) {
    const { state, session } = pack
    const patient = state.patients.find((p) => String(p.id) === String(patientId))
    const block = blockReason(state, session, patient)
    if (block) throw new Error(block)

    const token = uuid()
    const eventId = uuid()
    const at = new Date().toISOString()
    const actorId = session.userId || 'admin'
    const doctor = (state.staff || []).find(
      (s) =>
        s.profession === 'doctor' &&
        s.institutionId === TARGET.institutionId &&
        s.departmentId === TARGET.departmentId,
    )

    let next = { ...state, events: [...(state.events || [])] }
    next.events.push({
      id: eventId,
      patientId: patient.id,
      patientName: displayName(patient),
      type: 'consultation-started',
      actorId,
      at,
      note: patient.stage === 'registered' ? '建立远程会诊入口，等待医生接诊' : '申请远程会诊',
      scopes: [patient],
      userIds: [...(patient.assignedTo || [])],
    })

    const request = {
      id: eventId,
      patientId: patient.id,
      token,
      status: 'pending',
      institutionId: TARGET.institutionId,
      departmentId: TARGET.departmentId,
      createdBy: actorId,
      createdAt: at,
      sourceInstitutionId: patient.institutionId,
      sourceDepartmentId: patient.departmentId,
      nominatedDoctorId: doctor?.id,
      feedback: [],
    }

    next.patients = next.patients.map((p) => {
      if (String(p.id) !== String(patientId)) return p
      const base = {
        ...p,
        consultationToken: token,
        consultationDoctorId: undefined,
        consultationRequestId: request.id,
        updatedAt: at,
      }
      return patient.stage === 'registered' ? { ...base, stage: 'consulting' } : base
    })
    next.consultationRequests = [...(next.consultationRequests || []), request]
    pack.state = next
    return displayName(patient)
  }

  function toast(msg) {
    let el = document.querySelector('.toast')
    if (!el) {
      el = document.createElement('div')
      el.className = 'toast'
      document.body.appendChild(el)
    }
    el.textContent = msg
    clearTimeout(toast._t)
    toast._t = setTimeout(() => {
      el.textContent = ''
    }, 5000)
  }

  function buildPageHtml(rows) {
    const body = rows.length
      ? rows
          .map((row) => {
            const why = row._block
            return `<tr>
              <td><strong>${esc(row.name)}</strong><small>${esc(row.id)}</small></td>
              <td>${esc(row.symptoms)}</td>
              <td><span class="badge">${esc(row.stageLabel)}</span></td>
              <td><button type="button" class="primary" data-hx-pick-start="${esc(row.pid)}" ${why ? `disabled title="${esc(why)}"` : ''}>发起会诊</button></td>
            </tr>`
          })
          .join('')
      : '<tr><td colspan="4" class="hx-consult-pick-empty">暂无可见患者，请先在「患者登记」新建档案。</td></tr>'

    return `<div class="hx-consult-pick-page">
      <header class="workspace-heading">
        <div>
          <h1>选择患者 · 发起远程会诊</h1>
          <span>申请将进入威远县人民医院 · 急诊科「科室待接诊」队列</span>
        </div>
        <a class="button" href="#/consultations">返回远程会诊</a>
      </header>
      <div class="filter-bar hx-consult-pick-filter">
        <span class="field">在列表中选择患者并点击「发起会诊」</span>
      </div>
      <div class="business-table table-scroll">
        <table>
          <thead><tr><th>患者</th><th>主诉</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`
  }

  function bindActions(root) {
    root.querySelectorAll('[data-hx-pick-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-hx-pick-start')
        if (!pid) return
        try {
          const fresh = loadStore()
          const name = applyConsult(fresh, pid)
          persistStore(fresh)
          toast(`已为「${name}」发起远程会诊`)
          location.hash = '#/consultations'
          setTimeout(() => location.reload(), 60)
        } catch (err) {
          toast(err.message || '发起失败')
        }
      })
    })
  }

  function teardown() {
    document.body.classList.remove('hx-consult-pick-route')
    document.getElementById('hx-consult-pick-root')?.remove()
    document.querySelectorAll('.hx-consult-pick-host-hidden').forEach((el) => {
      el.classList.remove('hx-consult-pick-host-hidden')
    })
    document.querySelector('main.workspace')?.classList.remove('hx-consult-pick-workspace')
  }

  function renderPickPage() {
    if (!isPickPage()) {
      teardown()
      return
    }

    const main = document.querySelector('main.workspace')
    if (!main) return

    let pack
    try {
      pack = loadStore()
    } catch (e) {
      toast(e.message || '无法读取患者')
      return
    }

    const { state, session } = pack
    const seen = new Set()
    const rows = (state.patients || [])
      .filter((p) => {
        const id = displayId(p)
        if (!id || id === '—' || seen.has(id)) return false
        seen.add(id)
        return canSee(session, p)
      })
      .map((p) => ({
        pid: String(p.id),
        name: displayName(p),
        id: displayId(p),
        symptoms: (p.symptoms || []).join('、') || '—',
        stageLabel: STAGE[p.stage] || p.stage || '—',
        _block: blockReason(state, session, p),
      }))

    const html = buildPageHtml(rows)
    document.body.classList.add('hx-consult-pick-route')
    main.classList.add('hx-consult-pick-workspace')

    main.querySelectorAll(':scope > *').forEach((el) => {
      if (el.id === 'hx-consult-pick-root') return
      el.classList.add('hx-consult-pick-host-hidden')
    })

    let root = document.getElementById('hx-consult-pick-root')
    if (!root) {
      root = document.createElement('div')
      root.id = 'hx-consult-pick-root'
      main.appendChild(root)
    }
    if (root.dataset.body === html) return
    root.dataset.body = html
    root.innerHTML = html
    bindActions(root)
  }

  if (!window.__hxConsultPickNav) {
    window.__hxConsultPickNav = true
    document.addEventListener(
      'click',
      (e) => {
        if (path() !== '/consultations') return
        const btn = e.target.closest?.('button')
        if (!btn || !(btn.textContent || '').includes('选择患者发起会诊')) return
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        location.hash = '#/consultations/pick'
      },
      true,
    )
  }

  window.hxEnhance(renderPickPage, { wait: 120, afterNav: 50 })
  window.addEventListener('hashchange', () => {
    if (!isPickPage()) teardown()
    else renderPickPage()
  })
})()
