import { Activity, Bell, Building2, Database, Target } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { MAP_THEME_LIST, type MapThemeId, resolveMapThemeId, setMapThemeInUrl } from '../mapTheme'
import { EventBarChart, ProgressGauge, TrendLineChart } from './Charts'
import { MapScene } from './MapScene'

const CALLOUTS = [
  {
    icon: Target,
    title: '重点区域',
    desc: '实时状态监控',
    style: { top: '12%', left: '8%' },
  },
  {
    icon: Bell,
    title: '事件告警',
    desc: '异常快速定位',
    style: { top: '10%', right: '22%' },
  },
  {
    icon: Building2,
    title: '设施分布',
    desc: '全面感知覆盖',
    style: { top: '42%', left: '6%' },
  },
  {
    icon: Database,
    title: '数据流向',
    desc: '多源数据汇聚',
    style: { bottom: '28%', left: '50%', transform: 'translateX(-50%)' },
  },
] as const

export default function App() {
  const [themeId, setThemeId] = useState<MapThemeId>(() => resolveMapThemeId('mono'))

  const pickTheme = useCallback((id: MapThemeId) => {
    setMapThemeInUrl(id)
    setThemeId(id)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.mapTheme = themeId
  }, [themeId])

  return (
    <div className="sc-root">
      <div className="sc-grid-bg" aria-hidden />
      <header className="sc-header">
        <div>
          <p className="sc-kicker">SMART COUNTY · DIGITAL TWIN</p>
          <h1>威远县 · 智慧城市 3D 态势演示</h1>
        </div>
        <div className="sc-header-meta">
          <div className="sc-theme-bar" role="group" aria-label="地图配色">
            <span className="sc-theme-bar-label">配色</span>
            {MAP_THEME_LIST.filter((t) => t.id !== 'light').map((t) => (
              <button
                key={t.id}
                type="button"
                className={`sc-theme-swatch${themeId === t.id ? ' is-active' : ''}`}
                title={t.label}
                aria-pressed={themeId === t.id}
                style={{ '--swatch': t.swatch } as React.CSSProperties}
                onClick={() => pickTheme(t.id)}
              />
            ))}
          </div>
          <span>
            <Activity size={14} /> 实时演示
          </span>
          <a href={`/gis-command.html?region=weiyuan&theme=${themeId}`} className="sc-link-back">
            2D GIS（同配色）
          </a>
          <a href="/#/" className="sc-link-back">
            返回指挥中枢
          </a>
        </div>
      </header>

      <div className="sc-stage">
        <aside className="sc-panel sc-panel-left">
          <div className="sc-panel-title">事件数</div>
          <div className="sc-chart-box">
            <EventBarChart />
          </div>
        </aside>

        <main className="sc-map-wrap">
          <MapScene themeId={themeId} />
          {CALLOUTS.map((c) => (
            <div key={c.title} className="sc-callout" style={c.style}>
              <c.icon size={18} />
              <div>
                <strong>{c.title}</strong>
                <span>{c.desc}</span>
              </div>
            </div>
          ))}
        </main>

        <aside className="sc-panel sc-panel-right">
          <div className="sc-panel-title">趋势分析</div>
          <div className="sc-chart-box sc-chart-tall">
            <TrendLineChart />
          </div>
          <div className="sc-panel-title">处置进度</div>
          <div className="sc-chart-box sc-chart-gauge">
            <ProgressGauge />
          </div>
        </aside>
      </div>
    </div>
  )
}
