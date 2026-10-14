import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ROUTES } from '../routes/meta'

const GROUP_ORDER = [
  '指挥大屏',
  '预警与重症',
  '患者与床位',
  '会诊协同',
  '质控管理',
  '机构与配置',
  '移动端与会诊',
  '系统',
] as const

export function AppShell() {
  const location = useLocation()
  const { user, logout, error } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>华西 · 县域急危重症救治一体化指挥中心</h1>
          <div className="subtitle">Vite + React 源码 · 后端 API</div>
        </div>
        <div className="app-header-actions">
          <span className="subtitle">{location.pathname || '/'}</span>
          {error ? <span className="api-error">{error}</span> : null}
          {user ? (
            <button type="button" className="btn-ghost" onClick={() => logout()}>
              退出
            </button>
          ) : null}
        </div>
      </header>
      <aside className="app-sidebar">
        <nav>
          {GROUP_ORDER.map((group) => {
            const items = NAV_ROUTES.filter((r) => r.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <div className="nav-group-label">{group}</div>
                {items.map((route) => {
                  const navPath =
                    route.path.includes(':') ? route.path.split('/:')[0] || route.path : route.path
                  const end = navPath === '/'
                  return (
                    <NavLink
                      key={route.path}
                      to={navPath}
                      end={end}
                      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                      {route.title}
                      <small>{route.path}</small>
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </aside>
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  )
}
