/** 浏览器内 Laravel v1 客户端（依赖 index 注入的 window.hxBackend） */

type HxBackend = {
  ensureAuth(): Promise<boolean>
  get(path: string, query?: Record<string, string | number>): Promise<unknown>
  post(path: string, body?: unknown): Promise<unknown>
  put(path: string, body?: unknown): Promise<unknown>
  patch(path: string, body?: unknown): Promise<unknown>
  delete(path: string): Promise<unknown>
  request(method: string, path: string, body?: unknown): Promise<unknown>
  enabled(): boolean
  strict(): boolean
}

declare global {
  interface Window {
    hxBackend?: HxBackend
  }
}

function api(): HxBackend {
  if (!window.hxBackend?.enabled()) {
    throw new Error('后端桥接未启用')
  }
  return window.hxBackend
}

export async function hxEnsureAuth() {
  return api().ensureAuth()
}

export async function hxGet(path: string, query?: Record<string, string | number>) {
  await hxEnsureAuth()
  return api().get(path, query)
}

export async function hxPost(path: string, body?: unknown) {
  await hxEnsureAuth()
  return api().post(path, body)
}

export async function hxPut(path: string, body?: unknown) {
  await hxEnsureAuth()
  return api().put(path, body)
}
