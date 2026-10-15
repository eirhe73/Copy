import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { plateSubLinks } from './navActive'

function useSidebarShell() {
  const [on, setOn] = useState(() => document.body.classList.contains('hx-sidebar-shell'))
  useEffect(() => {
    const sync = () => setOn(document.body.classList.contains('hx-sidebar-shell'))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('hashchange', sync)
    return () => {
      obs.disconnect()
      window.removeEventListener('hashchange', sync)
    }
  }, [])
  return on
}

function linkMatches(link: string, pathname: string, search: string): boolean {
  const ref = new URL(link, 'http://local')
  const current = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (ref.pathname !== pathname) return false
  return ['mode', 'view', 'focus'].every(
    (key) => ref.searchParams.get(key) === current.get(key),
  )
}

export function PlateSubNav() {
  const { pathname, search } = useLocation()
  const sidebarShell = useSidebarShell()
  if (sidebarShell) return null
  if (pathname === '/' || pathname === '/login' || pathname === '') return null
  const links = plateSubLinks(pathname, search)
  if (!links.length) return null

  return (
    <nav className="filter-bar" aria-label="模块二级导航" style={{ margin: '0 16px' }}>
      {links.map(([to, label]) => (
        <Link
          key={to}
          to={to}
          className={linkMatches(to, pathname, search) ? 'btn-primary' : 'btn-ghost'}
          style={{ marginRight: 8 }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
