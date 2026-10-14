import { Activity, Ambulance, ClipboardCheck, HeartPulse, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHomeRegion } from '../context/HomeRegionContext'
import { IA_PLATES } from './iaNav'
import { activePlateIndex } from './navActive'

const PLATE_ICONS = [Ambulance, Activity, HeartPulse, ClipboardCheck, Stethoscope]

export function CommandHeader() {
  const location = useLocation()
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const isHome = location.pathname === '/'
  const { countyLabel } = useHomeRegion()
  const plateIdx = activePlateIndex(location.pathname, location.search)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  return (
    <header className={`command-header ${isHome ? 'home-header' : 'compact-header'}`}>
      <div className="header-rail" />
      <div className="header-left">
        <time>
          {now.toLocaleDateString('zh-CN')} {now.toLocaleTimeString('zh-CN', { hour12: false })}
        </time>
        <span>{weekdays[now.getDay()]}</span>
        {!isHome ? (
          <Link to="/" className="compact-brand">
            华西 · 一体化指挥中心
          </Link>
        ) : null}
      </div>
      {isHome ? (
        <h1>
          华西—{countyLabel} <span>县域急危重症救治一体化指挥中心</span>
        </h1>
      ) : null}
      <nav className="main-nav" aria-label="五个业务模块">
        {IA_PLATES.map((plate, i) => {
          const Icon = PLATE_ICONS[i] ?? Ambulance
          return (
            <Link key={plate.home} to={plate.home} className={plateIdx === i ? 'active' : ''}>
              <Icon size={18} />
              {plate.title}
            </Link>
          )
        })}
      </nav>
      <div className="header-right">
        <Link to="/phone" className="phone-trigger">
          手机演示
        </Link>
        <span className="identity">
          {user && typeof user === 'object' && 'name' in user
            ? String((user as { name?: string }).name)
            : '已登录'}
        </span>
        <Link to="/settings">设置</Link>
      </div>
    </header>
  )
}
