import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGet, login as apiLogin } from '../lib/apiClient'

type AuthUser = Record<string, unknown> | null

type AuthContextValue = {
  ready: boolean
  user: AuthUser
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshMe = useCallback(async () => {
    try {
      const me = await apiGet<AuthUser>('/auth/me')
      setUser(me)
      setError(null)
    } catch (e) {
      setUser(null)
      setError(String(e instanceof Error ? e.message : e))
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password)
      await refreshMe()
    },
    [refreshMe],
  )

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem('huaxi-jwt-token')
      localStorage.removeItem('huaxi-jwt-token')
    } catch {
      /* ignore */
    }
    setUser(null)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await apiLogin()
        await refreshMe()
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e))
      } finally {
        setReady(true)
      }
    })()
  }, [refreshMe])

  const value = useMemo(
    () => ({ ready, user, error, login, logout, refreshMe }),
    [ready, user, error, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 需在 AuthProvider 内使用')
  return ctx
}
