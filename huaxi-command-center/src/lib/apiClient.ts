/**
 * Laravel /api/v1 客户端（与 public/assets/backend-api-bridge 行为一致，供 React 源码使用）
 */

const TOKEN_KEY = 'huaxi-jwt-token'

export type ApiEnvelope<T = unknown> = {
  code?: number
  message?: string
  data?: T
}

function apiRoot(): string {
  const env = import.meta.env.VITE_API_BASE as string | undefined
  if (env) return env.replace(/\/$/, '').replace(/\/v1$/, '')
  return '/backend-api'
}

function v1Base(): string {
  return `${apiRoot()}/v1`
}

function loadToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'code' in body && (body as ApiEnvelope).code === 200 && 'data' in body) {
    return (body as ApiEnvelope<T>).data as T
  }
  return body as T
}

export function asList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.data)) return p.data
    if (Array.isArray(p.list)) return p.list
  }
  return []
}

let loginPromise: Promise<string> | null = null

/** 开发时略短，便于 Network 里看到请求；生产可仍走缓存 */
const GET_CACHE_TTL_MS = import.meta.env.DEV ? 4_000 : 12_000
const getCache = new Map<string, { at: number; data: unknown }>()
const getInflight = new Map<string, Promise<unknown>>()

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function login(username?: string, password?: string): Promise<string> {
  const u = username ?? import.meta.env.VITE_API_USER ?? 'admin'
  const p = password ?? import.meta.env.VITE_API_PASS ?? '123456'
  if (loginPromise) return loginPromise
  loginPromise = (async () => {
    const res = await fetch(`${v1Base()}/auth/login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    })
    if (!res.ok) throw new Error(`登录失败 HTTP ${res.status}`)
    const json = await res.json()
    const data = unwrap<{ token: string }>(json)
    if (!data?.token) throw new Error('登录响应无 token')
    saveToken(data.token)
    return data.token
  })().finally(() => {
    loginPromise = null
  })
  return loginPromise
}

async function authHeaders(): Promise<HeadersInit> {
  let token = loadToken()
  if (!token) token = await login()
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function fetchWithAuth(url: string, init: RequestInit, p: string): Promise<Response> {
  let res = await fetch(url, init)
  if (res.status === 401) {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    await login()
    const headers2 = await authHeaders()
    res = await fetch(url, { ...init, headers: headers2 })
  }
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') || '2')
    await sleep(Math.min(8, Math.max(1, retryAfter)) * 1000)
    const headers3 = await authHeaders()
    res = await fetch(url, { ...init, headers: headers3 })
  }
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${p} → HTTP ${res.status}`)
  return res
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${v1Base()}${p}`

  if (method === 'GET') {
    const now = Date.now()
    const hit = getCache.get(url)
    if (hit && now - hit.at < GET_CACHE_TTL_MS) return hit.data as T
    const pending = getInflight.get(url)
    if (pending) return (await pending) as T
    const job = (async () => {
      const headers = await authHeaders()
      const res = await fetchWithAuth(url, { method: 'GET', headers }, p)
      const json = await res.json()
      const data = unwrap<T>(json)
      getCache.set(url, { at: Date.now(), data })
      return data
    })().finally(() => {
      getInflight.delete(url)
    })
    getInflight.set(url, job)
    return job
  }

  const headers = await authHeaders()
  const init: RequestInit = { method, headers }
  if (body !== undefined) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetchWithAuth(url, init, p)
  const json = await res.json()
  getCache.clear()
  return unwrap<T>(json)
}

export function apiGet<T = unknown>(path: string) {
  return request<T>('GET', path)
}

export function apiPost<T = unknown>(path: string, body?: unknown) {
  return request<T>('POST', path, body)
}

export function apiPut<T = unknown>(path: string, body?: unknown) {
  return request<T>('PUT', path, body)
}

export function apiDelete<T = unknown>(path: string) {
  return request<T>('DELETE', path)
}

export async function apiList(path: string, query?: Record<string, string | number>) {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([k, v]) => params.set(k, String(v)))
  }
  const qs = params.toString()
  const full = qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path
  return asList(await apiGet(full))
}

export async function healthCheck() {
  const res = await fetch(`${apiRoot()}/health`)
  if (!res.ok) throw new Error('health failed')
  return res.json()
}
