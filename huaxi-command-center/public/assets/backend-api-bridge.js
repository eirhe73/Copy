/**
 * 全站 Mock → Laravel /api/v1（JWT + 响应适配）
 * 默认严格模式：不走 public/api/*.json（?api=mock 或 localStorage huaxi-api-mock=1 可开 mock）
 */
;(function () {
  function apiBase() {
    const cfg = window.HX_API_CONFIG
    if (cfg?.base) return String(cfg.base).replace(/\/$/, '')
    return '/backend-api'
  }

  function apiV1() {
    return `${apiBase()}/v1`
  }

  const AUTH_URL = () => `${apiV1()}/auth/login`
  const TOKEN_KEY = 'huaxi-jwt-token'

  function mockAllowed() {
    try {
      if (new URLSearchParams(location.search).get('api') === 'mock') return true
      if (localStorage.getItem('huaxi-api-mock') === '1') return true
    } catch {
      /* ignore */
    }
    return false
  }

  function bridgeOff() {
    try {
      if (localStorage.getItem('huaxi-api-bridge') === '0') return true
    } catch {
      /* ignore */
    }
    return false
  }

  function credentials() {
    try {
      const u = localStorage.getItem('huaxi-api-user') || 'admin'
      const p = localStorage.getItem('huaxi-api-pass') || '123456'
      return { username: u, password: p }
    } catch {
      return { username: 'admin', password: '123456' }
    }
  }

  function pathOf(input) {
    try {
      if (typeof input === 'string') {
        const u = input.startsWith('http') ? new URL(input) : new URL(input, location.origin)
        return u.pathname
      }
      if (input instanceof Request) return new URL(input.url).pathname
    } catch {
      /* ignore */
    }
    return ''
  }

  function methodOf(input, init) {
    if (init?.method) return String(init.method).toUpperCase()
    if (input instanceof Request) return String(input.method).toUpperCase()
    return 'GET'
  }

  const nativeFetch = window.fetch.bind(window)
  let token = null
  let loginPromise = null

  function loadToken() {
    try {
      token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
    } catch {
      token = null
    }
  }

  function clearToken() {
    token = null
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  }

  function saveToken(t) {
    token = t
    try {
      sessionStorage.setItem(TOKEN_KEY, t)
      localStorage.setItem(TOKEN_KEY, t)
    } catch {
      /* ignore */
    }
  }

  function unwrapEnvelope(body) {
    if (body && typeof body === 'object' && 'code' in body && 'data' in body && body.code === 200) {
      return body.data
    }
    return body
  }

  async function ensureAuth(force) {
    if (bridgeOff()) return false
    loadToken()
    if (token && !force) return true
    if (loginPromise) return loginPromise
    loginPromise = (async () => {
      try {
        const res = await nativeFetch(AUTH_URL(), {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials()),
        })
        if (!res.ok) throw new Error(`login ${res.status}`)
        const json = await res.json()
        const data = unwrapEnvelope(json)
        if (!data?.token) throw new Error('no token')
        saveToken(data.token)
        return true
      } catch (e) {
        console.error('[hx-api-bridge] JWT 登录失败', e)
        clearToken()
        return false
      } finally {
        loginPromise = null
      }
    })()
    return loginPromise
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  const GET_CACHE_TTL_MS = 8000
  /** @type {Map<string, { at: number, data: unknown }>} */
  const getCache = new Map()
  /** @type {Map<string, Promise<unknown>>} */
  const getInflight = new Map()
  let queueTail = Promise.resolve()
  let lastRequestAt = 0
  const MIN_GAP_MS = 120

  function cacheKey(method, apiPath) {
    return `${method}:${apiPath}`
  }

  async function throttleGap() {
    const now = Date.now()
    const wait = Math.max(0, MIN_GAP_MS - (now - lastRequestAt))
    if (wait) await sleep(wait)
    lastRequestAt = Date.now()
  }

  async function backendRequest(apiPath, init) {
    const method = String(init?.method || 'GET').toUpperCase()
    const key = cacheKey(method, apiPath)

    if (method === 'GET' && !init?._skipCache) {
      const hit = getCache.get(key)
      if (hit && Date.now() - hit.at < GET_CACHE_TTL_MS) return hit.data
      const inflight = getInflight.get(key)
      if (inflight) return inflight
    }

    const run = async () => {
      await ensureAuth(false)
      await throttleGap()
      const headers = {
        Accept: 'application/json',
        ...(init?.headers || {}),
      }
      if (token) headers.Authorization = `Bearer ${token}`
      let res = await nativeFetch(`${apiV1()}${apiPath}`, { ...init, headers })
      if (res.status === 401 && !init?._retried) {
        clearToken()
        const ok = await ensureAuth(true)
        if (!ok) throw new Error(`未授权 ${apiPath}`)
        return backendRequest(apiPath, { ...init, _retried: true, _skipCache: true })
      }
      let attempt = 0
      while (res.status === 429 && attempt < 3) {
        attempt += 1
        const wait = Number(res.headers.get('Retry-After') || attempt) * 1000
        await sleep(Math.min(8000, Math.max(800, wait)))
        res = await nativeFetch(`${apiV1()}${apiPath}`, {
          ...init,
          headers: { ...headers, Authorization: token ? `Bearer ${token}` : headers.Authorization },
        })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${apiPath}`)
      const ct = res.headers.get('content-type') || ''
      const body = ct.includes('application/json') ? await res.json() : await res.text()
      if (method === 'GET' && !init?._skipCache) {
        getCache.set(key, { at: Date.now(), data: body })
      }
      return body
    }

    const task =
      method === 'GET' && !init?._skipCache
        ? (() => {
            const p = queueTail.then(run)
            queueTail = p.catch(() => {})
            getInflight.set(key, p)
            return p.finally(() => {
              getInflight.delete(key)
            })
          })()
        : queueTail.then(run).then((v) => {
            queueTail = Promise.resolve()
            return v
          })

    return task
  }

  async function backendGet(apiPath) {
    return backendRequest(apiPath, { method: 'GET' })
  }

  async function backendJson(method, apiPath, body) {
    const init = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body !== undefined) init.body = JSON.stringify(body)
    const json = await backendRequest(apiPath, init)
    return unwrapEnvelope(json)
  }

  const GPS_STATUS_ZH = {
    STANDBY: '待命',
    DISPATCHING: '出警中',
    ON_SCENE: '现场处置',
    RETURNING: '返院途中',
  }

  function adaptSlaPayload(body) {
    const raw = unwrapEnvelope(body)
    if (!raw || typeof raw !== 'object') return raw
    const rec = raw.records
    if (rec && !Array.isArray(rec) && Array.isArray(rec.data)) {
      return { ...raw, records: rec.data }
    }
    return raw
  }

  function adaptVehiclesGps(body) {
    const data = unwrapEnvelope(body)
    if (!data?.vehicles) return data
    return {
      ...data,
      vehicles: data.vehicles.map((v) => ({
        ...v,
        status: GPS_STATUS_ZH[v.status] || v.status,
      })),
    }
  }

  async function loadStaticGisCollab() {
    const r = await nativeFetch('/api/gis-collab.json', { cache: 'no-store' })
    if (!r.ok) throw new Error('static gis-collab missing')
    return r.json()
  }

  async function adaptGisCollab() {
    try {
      // 后端 county-map 不按 region 过滤，直接拉取全量节点，统一挂到 weiyuan 下
      const raw = await backendGet('/dashboard/county-map')
      const data = unwrapEnvelope(raw)
      const pack = {
        erToday: data?.erToday ?? 0,
        nodes: data?.nodes ?? [],
        links: data?.links ?? [],
      }
      return {
        updatedAt: data?.updatedAt || new Date().toISOString(),
        weiyuan: pack,
        dafang: { erToday: 0, nodes: [], links: [] },
      }
    } catch (e) {
      console.warn('[hx-api-bridge] county-map 失败', e)
      throw e
    }
  }

  async function adaptGrassrootsRemote() {
    const raw = await backendGet('/critical/vitals?pageNum=1&pageSize=30')
    const data = unwrapEnvelope(raw)
    const list = data?.list || []
    return {
      title: '基层远程监护',
      notice: '数据来源：GET /api/v1/critical/vitals',
      sites: list.map((item) => ({
        name: item.bedLabel || item.bedId || '监护点',
        patient: item.patientName || item.patientId || '—',
        vitals: `HR ${item.heartRate ?? '—'} · SpO₂ ${item.spo2 ?? '—'}%`,
        videoHref: '/#/monitoring',
        bedHref: item.bedId ? `/#/bed/${item.bedId}` : '/#/critical',
      })),
    }
  }

  async function adaptSubHospitalMonitor() {
    const orgRaw = await backendGet('/organizations?per_page=50')
    const orgPayload = unwrapEnvelope(orgRaw)
    const orgs = Array.isArray(orgPayload?.data)
      ? orgPayload.data
      : Array.isArray(orgPayload)
        ? orgPayload
        : []
    const hospitals = []
    for (const org of orgs.slice(0, 8)) {
      const code = org.org_code || org.id
      if (!code) continue
      let depts = []
      try {
        const bedRaw = await backendGet(`/beds/by-dept?hospitalId=${encodeURIComponent(code)}`)
        const bed = unwrapEnvelope(bedRaw)
        depts = (bed?.departments || []).map((d) => ({
          name: d.name,
          bedsUsed: d.occupied,
          bedsTotal: d.total,
          alerts: 0,
          status: d.free <= 1 ? '紧张' : d.occupied / (d.total || 1) > 0.85 ? '关注' : '正常',
        }))
      } catch {
        depts = []
      }
      if (!depts.length) continue
      hospitals.push({
        id: code,
        name: org.org_name,
        tier: org.org_type || '机构',
        departments: depts,
      })
    }
    return {
      title: '下级医院科室监控',
      notice: '数据来源：organizations + beds/by-dept',
      hospitals,
    }
  }

  /** @type {Record<string, string | (() => Promise<unknown>)>} */
  const MOCK_ROUTES = {
    '/api/qc-standards.json': () => backendGet('/qc-standards/summary').then(unwrapEnvelope),
    '/api/qc-sla.json': () => backendGet('/sla-records').then(adaptSlaPayload),
    '/api/dispatch-live.json': () => backendGet('/dispatch-live').then(unwrapEnvelope),
    '/api/dispatch-ambulances.json': () => backendGet('/ambulances').then(unwrapEnvelope),
    '/api/vehicles-gps.json': () => backendGet('/vehicles/gps').then(adaptVehiclesGps),
    '/api/warning-demo.json': () => backendGet('/warnings/summary').then(unwrapEnvelope),
    '/api/consultation-admission.json': () => backendGet('/consultations/admission').then(unwrapEnvelope),
    '/api/beds-by-dept.json': () => backendGet('/beds/by-dept').then(unwrapEnvelope),
    '/api/care-bindings.json': () => backendGet('/care-bindings').then(unwrapEnvelope),
    '/api/device-bindings.json': () => backendGet('/devices').then(unwrapEnvelope),
    '/api/gis-collab.json': adaptGisCollab,
    '/api/grassroots-remote-monitor.json': adaptGrassrootsRemote,
    '/api/sub-hospital-monitor.json': adaptSubHospitalMonitor,
    '/api/grassroots-demo.json': async () => {
      const transfers = await window.hxBackend.list('/transfers', { per_page: 5 })
      const consult = await unwrapEnvelope(await backendGet('/consultations?pageNum=1&pageSize=5'))
      const list = consult?.list || consult?.data || []
      return {
        title: '基层调度链（后端）',
        notice: 'transfers + consultations',
        steps: [
          { id: 'consult', label: '会诊', detail: list[0]?.sessionId || '队列', href: '/#/consultations' },
          { id: 'transfer', label: '转诊', detail: transfers[0]?.transfer_code || '转诊单', href: '/#/transfers' },
        ],
        transferDemo: transfers[0]
          ? { patientName: transfers[0].patient?.real_name || '患者', badge: '后端转诊' }
          : null,
      }
    },
  }

  async function hydrateScenario() {
    const useFull =
      window.hxFullBackend?.() && window.hxBackend?.strict?.() && window.hxBuildScenarioFromBackend
    if (useFull) {
      try {
        await ensureAuth(false)
        return await window.hxBuildScenarioFromBackend()
      } catch (e) {
        console.error('[hx-api-bridge] 全后端 scenario 失败，回退 scenario.json', e)
        const r = await nativeFetch('/scenario.json', { cache: 'no-store' })
        if (r.ok) return r.json()
        if (mockAllowed()) return {}
        throw e
      }
    }
    const base = await nativeFetch('/scenario.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { state: {} }))
      .catch(() => ({ schemaVersion: 2, state: {} }))
    if (window.hxLiveMergeEnabled?.() && window.hxMergeScenarioFromApis) {
      try {
        return await window.hxMergeScenarioFromApis(base)
      } catch (e) {
        console.warn('[hx-api-bridge] scenario live merge', e)
        return base
      }
    }
    if (!window.hxFullBackend?.() || !window.hxBackend?.strict?.()) return base
    if (window.hxBuildScenarioFromBackend) {
      try {
        await ensureAuth(false)
        const fromApi = await window.hxBuildScenarioFromBackend()
        base.state = { ...base.state, ...fromApi.state }
        base.mobile = fromApi.mobile || base.mobile
        base.vehicles = fromApi.vehicles?.length ? fromApi.vehicles : base.vehicles
        base.measurements = fromApi.measurements?.length ? fromApi.measurements : base.measurements
        base.notice = fromApi.notice
      } catch (e) {
        console.warn('[hx-api-bridge] scenario partial sync', e)
      }
    }
    return base
  }

  MOCK_ROUTES['/scenario.json'] = hydrateScenario

  function jsonResponse(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      statusText: status === 503 ? 'Service Unavailable' : 'OK',
      headers: { 'Content-Type': 'application/json' },
    })
  }

  window.fetch = function hxFetch(input, init) {
    const path = pathOf(input)
    const method = methodOf(input, init)
    const handler = MOCK_ROUTES[path]

    if (!bridgeOff() && method === 'GET' && (path === '/scenario.json' || handler)) {
      const fn = path === '/scenario.json' ? hydrateScenario : handler
      return Promise.resolve()
        .then(() => (typeof fn === 'function' ? fn() : backendGet(fn).then(unwrapEnvelope)))
        .then((body) => jsonResponse(body))
        .catch(async (err) => {
          console.warn('[hx-api-bridge] 后端请求失败:', path, err)
          if (path === '/scenario.json' || mockAllowed()) {
            const r = await nativeFetch(path === '/scenario.json' ? '/scenario.json' : input, init)
            if (r.ok) return r
          }
          if (path === '/api/gis-collab.json') {
            try {
              return jsonResponse(await loadStaticGisCollab())
            } catch {
              /* fall through */
            }
          }
          return jsonResponse(
            { error: 'backend_unavailable', path, message: String(err.message || err) },
            503,
          )
        })
    }

    if (!bridgeOff() && path.startsWith('/api/v1/')) {
      const apiPath = path.slice('/api/v1'.length) || '/'
      const qs = typeof input === 'string' && input.includes('?') ? input.slice(input.indexOf('?')) : ''
      return backendRequest(`${apiPath}${qs}`, { method, ...(init || {}), body: init?.body })
        .then((body) => {
          if (typeof body === 'string') return new Response(body, { status: 200 })
          return jsonResponse(body)
        })
        .catch((err) => {
          if (mockAllowed()) return nativeFetch(input, init)
          return jsonResponse({ error: String(err.message || err) }, 503)
        })
    }

    return nativeFetch(input, init)
  }

  function getJson(path, query) {
    const [base, embeddedQs] = path.split('?')
    const params = new URLSearchParams(embeddedQs || '')
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v))
      })
    }
    const qs = params.toString()
    return backendGet(`${base}${qs ? `?${qs}` : ''}`).then(unwrapEnvelope)
  }

  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    if (payload && Array.isArray(payload.list)) return payload.list
    return []
  }

  window.hxBackend = {
    enabled: () => !bridgeOff(),
    strict: () => !bridgeOff() && !mockAllowed(),
    base: apiV1(),
    apiRoot: apiBase,
    ensureAuth,
    unwrap: unwrapEnvelope,
    get: getJson,
    post(path, body) {
      return backendJson('POST', path.startsWith('/') ? path : `/${path}`, body)
    },
    put(path, body) {
      return backendJson('PUT', path.startsWith('/') ? path : `/${path}`, body)
    },
    patch(path, body) {
      return backendJson('PATCH', path.startsWith('/') ? path : `/${path}`, body)
    },
    delete(path) {
      return backendRequest(path.startsWith('/') ? path : `/${path}`, { method: 'DELETE' }).then(unwrapEnvelope)
    },
    request(method, path, body) {
      const m = method.toUpperCase()
      if (m === 'GET') return getJson(path)
      if (m === 'DELETE') return window.hxBackend.delete(path)
      return backendJson(m, path.startsWith('/') ? path : `/${path}`, body)
    },
    list(path, query) {
      return getJson(path, { per_page: 50, ...query }).then(asList)
    },
    health() {
      const tryUrls = [`${apiV1()}/health`, `${apiBase()}/health`, `${apiBase()}/v1/health`]
      return (async () => {
        for (const url of tryUrls) {
          try {
            const r = await nativeFetch(url, { headers: { Accept: 'application/json' } })
            if (r.ok) return r.json()
          } catch {
            /* next */
          }
        }
        return null
      })()
    },
  }

  if (!bridgeOff()) {
    ensureAuth(false).then((ok) => {
      if (ok) {
        console.info('[hx-api-bridge] 已登录 JWT，严格模式=', window.hxBackend.strict(), '全后端=', window.hxFullBackend?.())
        if (window.hxFullBackend?.()) window.hxSyncQualityTasks?.()
      } else console.warn('[hx-api-bridge] 未登录；请检查 HX_API_CONFIG / 后端服务与账号')
    })
  }
})()
