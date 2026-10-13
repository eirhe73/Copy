/**
 * 按当前 Hash 路由自动调用 HX_ROUTE_BINDINGS 中的全部读接口，并展示写操作入口
 */
;(function () {
  function routeKey() {
    const raw = (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
    const parts = raw.split('/').filter(Boolean)
    if (parts.length === 0) return { key: '/', params: {}, raw: '/' }
    if (parts[0] === 'medical-quality' && parts[1] === 'reports') {
      return { key: '/medical-quality/reports', params: {}, raw }
    }
    if (parts[0] === 'medical-quality' && parts[1] === 'rectify' && parts[2]) {
      return { key: '/medical-quality/rectify/:id', params: { id: parts[2] }, raw }
    }
    if (parts[0] === 'episode' && parts[1]) return { key: '/episode/:id', params: { id: parts[1] }, raw }
    if (parts[0] === 'transport' && parts[1]) return { key: '/transport/:id', params: { id: parts[1] }, raw }
    if (parts[0] === 'room' && parts[1]) return { key: '/room/:token', params: { token: parts[1] }, raw }
    if (parts[0] === 'join' && parts[1]) return { key: '/join/:token', params: { token: parts[1] }, raw }
    if (parts[0] === 'patient' && parts[1]) return { key: '/patient/:id', params: { id: parts[1] }, raw }
    if (parts[0] === 'bed' && parts[1]) return { key: '/bed/:id', params: { id: parts[1] }, raw }
    if (parts[0] === 'mobile-reception' && parts[1]) {
      return { key: '/mobile-reception/:token', params: { token: parts[1] }, raw }
    }
    if (parts[0] === 'center' && parts[1]) return { key: '/center/:id', params: { id: parts[1] }, raw }
    return { key: '/' + parts[0], params: {}, raw }
  }

  function fillPath(template, params) {
    return template.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(params[k] || '1'))
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  async function enrichParams(route, params) {
    await window.hxEnsureApiSamples?.()
    const s = window.__HX_API_SAMPLES__ || {}
    if (route.key === '/transport/:id') {
      const raw = params.id || ''
      params.transferNo = /^[A-Za-z]/.test(raw) ? raw : s.transferNo || raw
    }
    if (route.key === '/episode/:id' && /^DEMO-/i.test(params.id || '')) {
      params.eventId = s.eventId
      params.id = s.emergencyEventId || params.id
    }
    if (route.key === '/patient/:id' && /^DEMO-/i.test(params.id || '')) {
      params.id = s.patientId || params.id
    }
    if (route.key === '/bed/:id' && /^DEMO-/i.test(String(params.id || ''))) {
      params.id = s.bedId || params.id
    }
    if (route.key === '/medical-quality/rectify/:id' && !/^\d+$/.test(params.id || '')) {
      params.id = s.qcIssueId || params.id
    }
    return params
  }

  async function runBinding(item, params, route) {
    let path = item.path
    if (window.hxResolveApiPath && (path.includes('{') || item.useSamples)) {
      path = window.hxResolveApiPath(path, params)
    } else {
      path = fillPath(path, params)
    }
    const api = window.hxBackend
    if (!api?.enabled?.()) return { path, ok: false, error: 'bridge off' }
    try {
      await api.ensureAuth()
      const data = await api.request(item.method || 'GET', path)
      return { path, ok: true, data }
    } catch (e) {
      return { path, ok: false, error: String(e.message || e) }
    }
  }

  function writeActions(raw, params) {
    const actions = []
    if (raw === '/transfers') {
      actions.push({
        label: '确认首条转诊',
        run: async () => {
          const list = await window.hxBackend.list('/transfers', { per_page: 1 })
          const id = list[0]?.id
          if (!id) throw new Error('无转诊单')
          return window.hxBackend.post(`/transfers/${id}/confirm`, { review_note: '前端确认' })
        },
      })
    }
    if (raw.startsWith('/medical-quality/rectify/')) {
      const id = params.id
      actions.push({
        label: '销号（需 state_version）',
        run: async () => {
          const issue = await window.hxBackend.get(`/qc-issues/${id}`)
          return window.hxBackend.post(`/qc-issues/${id}/close`, {
            check_result: '达标',
            state_version: issue.state_version || 1,
          })
        },
      })
    }
    if (raw === '/settings') {
      actions.push({
        label: '演示数据重置',
        run: () => window.hxBackend?.post('/settings/demo-reset', {}),
      })
    }
    if (raw === '/warning') {
      actions.push({
        label: '处置首条预警',
        run: async () => {
          await window.hxEnsureApiSamples?.()
          const id = window.__HX_API_SAMPLES__?.warningId
          return window.hxBackend.post(`/warnings/${id}/dispose`, {
            stage: '护士确认',
            note: '前端试处置',
            nextStatus: 'acknowledged',
          })
        },
      })
    }
    if (raw === '/consultations') {
      actions.push({
        label: '接诊首条会诊',
        run: async () => {
          await window.hxEnsureApiSamples?.()
          const sid = window.__HX_API_SAMPLES__?.sessionId
          return window.hxBackend.post(`/consultations/${sid}/accept`, {})
        },
      })
    }
    if (raw.startsWith('/room/') || raw.startsWith('/join/')) {
      const token = params.token
      actions.push({
        label: '提交会诊意见',
        run: () =>
          window.hxBackend.post(`/rooms/${token}/opinions`, {
            opinion_text: '前端试提交意见',
            author_name: '演示医生',
          }),
      })
    }
    return actions
  }

  function renderDock(route, results, actions) {
    const ok = results.filter((r) => r.ok).length
    const host = document.querySelector('main') || document.body
    let box = document.getElementById('hx-api-route-dock')
    if (!box) {
      box = document.createElement('div')
      box.id = 'hx-api-route-dock'
      host.insertBefore(box, host.firstChild)
    }
    const rows = results
      .map(
        (r) =>
          `<tr class="${r.ok ? 'ok' : 'fail'}"><td>${esc(r.path)}</td><td>${r.ok ? '200' : esc(r.error || 'ERR')}</td></tr>`,
      )
      .join('')
    const act = actions
      .map(
        (a, i) =>
          `<button type="button" class="hx-api-write-btn" data-idx="${i}">${esc(a.label)}</button>`,
      )
      .join('')
    box.innerHTML = `<details class="hx-api-route-dock">
      <summary>后端 API · ${esc(route.raw)} · 已调用 ${ok}/${results.length}</summary>
      <div class="hx-api-write-row">${act || '<span class="muted">本页无预置写操作</span>'}</div>
      <div class="hx-api-route-scroll"><table><thead><tr><th>接口</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table></div>
    </details>`
    box.querySelectorAll('.hx-api-write-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const a = actions[Number(btn.getAttribute('data-idx'))]
        if (!a) return
        btn.disabled = true
        try {
          await a.run()
          btn.textContent = '成功 · 点击刷新页面'
        } catch (e) {
          btn.textContent = String(e.message || e)
        }
      })
    })
    window.__HX_ROUTE_API__ = { route: route.raw, results }
  }

  async function render() {
    if (!window.hxBackend?.enabled?.() || !window.HX_ROUTE_BINDINGS) return
    const route = routeKey()
    const bindings = window.HX_ROUTE_BINDINGS[route.key]
    if (!bindings?.length) {
      document.getElementById('hx-api-route-dock')?.remove()
      return
    }
    const params = await enrichParams(route, { ...route.params })
    const results = []
    for (const b of bindings) {
      results.push(await runBinding(b, params, route))
      if (bindings.length > 1) await new Promise((r) => setTimeout(r, 400))
    }
    renderDock(route, results, writeActions(route.raw, route.params))
  }

  window.addEventListener('hashchange', () => {
    document.getElementById('hx-api-route-dock')?.remove()
  })

  window.hxEnhance(render, { wait: 600, observeRoot: true, afterNav: 150 })
})()
