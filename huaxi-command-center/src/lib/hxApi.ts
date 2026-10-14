/** @deprecated 请使用 apiClient；保留别名便于旧代码迁移 */
export {
  apiGet as hxGet,
  apiPost as hxPost,
  apiPut as hxPut,
  apiDelete as hxDelete,
  apiList as hxList,
  login as hxLogin,
  unwrap as hxUnwrap,
} from './apiClient'

/** 补丁层 backend-api-bridge.js 注入到 window 的运行时桥（供 dispatch-hub 等旧代码调用） */
export type HxBackendBridge = {
  enabled(): boolean
  strict(): boolean
  base: string
  apiRoot: string
  ensureAuth(force?: boolean): Promise<boolean>
  unwrap<T>(body: unknown): T
  get<T = unknown>(path: string, query?: Record<string, string | number>): Promise<T>
  post<T = unknown>(path: string, body?: unknown): Promise<T>
  put<T = unknown>(path: string, body?: unknown): Promise<T>
  patch<T = unknown>(path: string, body?: unknown): Promise<T>
  delete<T = unknown>(path: string): Promise<T>
  request<T = unknown>(method: string, path: string, body?: unknown): Promise<T>
  list(path: string, query?: Record<string, string | number>): Promise<unknown[]>
  health(): Promise<unknown>
}

declare global {
  interface Window {
    hxBackend?: HxBackendBridge
  }
}
