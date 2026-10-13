import { NavLink, Outlet, useLocation } from 'react-router-dom'
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>华西 · 县域急危重症救治一体化指挥中心</h1>
          <div className="subtitle">本地复刻工程 · 开发导航</div>
        </div>
        <div className="subtitle">{location.pathname || '/'}</div>
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
