import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <main className="workspace login-page">
      <div className="login-card">
        <h2>华西 · 一体化指挥中心</h2>
        <label className="field">
          <span>账号</span>
          <input type="text" placeholder="登录医护账号" autoComplete="username" />
        </label>
        <label className="field">
          <span>密码</span>
          <input type="password" placeholder="演示环境任意输入" autoComplete="current-password" />
        </label>
        <Link to="/" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
          进入系统（演示）
        </Link>
      </div>
    </main>
  )
}
