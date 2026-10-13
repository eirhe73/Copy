/**
 * 在 backend-api-config / bridge 之前执行，把 .env 写入 localStorage（与 bridge 读取键一致）。
 */
function applyViteBackendEnv(): void {
  try {
    const base = import.meta.env.VITE_API_BASE as string | undefined
    const user = import.meta.env.VITE_API_USER as string | undefined
    const pass = import.meta.env.VITE_API_PASS as string | undefined
    const fullBackend = import.meta.env.VITE_FULL_BACKEND as string | undefined

    if (base?.trim()) localStorage.setItem('huaxi-api-origin', base.trim())
    if (user?.trim()) localStorage.setItem('huaxi-api-user', user.trim())
    if (pass?.trim()) localStorage.setItem('huaxi-api-pass', pass.trim())
    if (fullBackend === '1') {
      localStorage.setItem('huaxi-full-backend', '1')
      localStorage.removeItem('huaxi-api-mock')
    }
    if (fullBackend === '0') localStorage.setItem('huaxi-full-backend', '0')
  } catch {
    /* private mode / SSR */
  }
}

applyViteBackendEnv()
