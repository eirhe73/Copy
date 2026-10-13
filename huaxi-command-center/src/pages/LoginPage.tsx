import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [err, setErr] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setErr(null)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (ex) {
      setErr(String(ex instanceof Error ? ex.message : ex))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="workspace login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h2>华西 · 一体化指挥中心</h2>
        <p className="api-muted">JWT 登录 · POST /api/v1/auth/login</p>
        <label className="field">
          <span>账号</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span>密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {err ? <p className="api-error">{err}</p> : null}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '登录中…' : '登录'}
        </button>
        <Link to="/" className="api-muted">
          跳过（已自动登录时可直接进入）
        </Link>
      </form>
    </main>
  )
}
