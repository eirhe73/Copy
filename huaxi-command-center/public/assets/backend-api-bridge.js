/**
 * 基层调度 / 医院质控 / 基层 Dr.：将静态 mock 路径代理到 Laravel /api/v1
 * 开发：Vite proxy /backend-api → :8000/api；后端未启动时自动回退 public/api/*.json
 * 关闭：地址栏 ?api=mock 或 localStorage huaxi-api-bridge=0
 */
;(function () {
  const API_V1 = '/backend-api/v1'

  function bridgeOff() {
    try {
      if (new URLSearchParams(location.search).get('api') === 'mock') return true
      if (localStorage.getItem('huaxi-api-bridge') === '0') return true
    } catch {
      /* ignore */
    }
    return false
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

  /** @type {Record<string, string | (() => string)>} */
  const MOCK_GET = {
    '/api/qc-standards.json': '/qc-standards/summary',
    '/api/qc-sla.json': '/sla-records',
    '/api/dispatch-live.json': '/dispatch-live',
  }

  function adaptSlaPayload(body) {
    if (!body || typeof body !== 'object') return body
    const rec = body.records
    if (rec && !Array.isArray(rec) && Array.isArray(rec.data)) {
      return { ...body, records: rec.data }
    }
    return body
  }

  const nativeFetch = window.fetch.bind(window)

  async function backendGet(apiPath, init) {
    const res = await nativeFetch(`${API_V1}${apiPath}`, {
      ...init,
      method: 'GET',
      headers: { Accept: 'application/json', ...(init?.headers || {}) },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  window.fetch = function hxFetch(input, init) {
    const path = pathOf(input)
    const method = methodOf(input, init)
    const mapped = MOCK_GET[path]

    if (!bridgeOff() && method === 'GET' && mapped) {
      const apiPath = typeof mapped === 'function' ? mapped() : mapped
      return backendGet(apiPath, init)
        .then((body) => {
          if (path === '/api/qc-sla.json') body = adaptSlaPayload(body)
          return new Response(JSON.stringify(body), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
          })
        })
        .catch((err) => {
          console.warn('[hx-api-bridge] fallback mock:', path, err)
          return nativeFetch(input, init)
        })
    }

    return nativeFetch(input, init)
  }

  /**
   * @param {string} path e.g. '/organizations'
   * @param {Record<string, string | number>} [query]
   */
  function getJson(path, query) {
    const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''
    return backendGet(`${path}${qs}`)
  }

  /** Laravel paginated { data: [] } → array */
  function asList(payload) {
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    return []
  }

  window.hxBackend = {
    enabled: () => !bridgeOff(),
    base: API_V1,
    get: getJson,
    list(path, query) {
      return getJson(path, { per_page: 50, ...query }).then(asList)
    },
    health() {
      return nativeFetch('/backend-api/health', { headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .catch(() => null)
    },
  }
})()
