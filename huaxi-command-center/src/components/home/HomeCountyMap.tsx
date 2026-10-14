import { Activity } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useHomeRegion } from '../../context/HomeRegionContext'
import { useHomeMapEnhancers } from '../../hooks/useHomeMapEnhancers'
import { useRouteApi } from '../../hooks/useRouteApi'
import { CenterMetricsBar } from './CenterMetricsBar'
import { MapCollabPanel } from './MapCollabPanel'
import { MapLegend, MapTools } from './MapChrome'

const MapScene = lazy(() => import('../../smart-city/MapScene').then((m) => ({ default: m.MapScene })))

type Props = {
  kpiEmergency?: string
  kpiClosed?: string
  bedsOverview?: unknown
  onCountyMap?: (payload: { erToday?: number }) => void
}

export function HomeCountyMap({
  kpiEmergency = '—',
  kpiClosed = '—',
  bedsOverview,
  onCountyMap,
}: Props) {
  const { region, setRegion } = useHomeRegion()
  const { ready, authenticated } = useAuth()
  const { results, loading: countyLoading } = useRouteApi(
    [{ method: 'GET', path: '/dashboard/county-map' }],
    {},
    { enabled: ready && authenticated },
  )
  const countyResult = results[0]
  const county = countyResult?.ok ? countyResult.data : undefined
  const countyError = countyResult && !countyResult.ok ? countyResult.error : undefined

  useEffect(() => {
    if (!county || typeof county !== 'object') return
    const erToday = (county as Record<string, unknown>).erToday
    onCountyMap?.({
      erToday: erToday != null && !Number.isNaN(Number(erToday)) ? Number(erToday) : undefined,
    })
  }, [county, onCountyMap])

  useHomeMapEnhancers(true)

  return (
    <>
      <CenterMetricsBar region={region} bedsOverview={bedsOverview} />
      <div className="region-switch segmented">
        <button type="button" className={region === 'dafang' ? 'selected' : ''} onClick={() => setRegion('dafang')}>
          大方参考
        </button>
        <button type="button" className={region === 'weiyuan' ? 'selected' : ''} onClick={() => setRegion('weiyuan')}>
          威远协作
        </button>
      </div>
      <div className="main-map">
        <MapLegend />
        <MapTools />
        <div className="county-map">
          <MapCollabPanel
            loading={ready && authenticated && countyLoading}
            error={!authenticated ? '未登录' : countyError}
            payload={county}
          />
          <Suspense fallback={<p className="api-muted">地图加载中…</p>}>
            <MapScene themeId="light" region={region} variant="command" />
          </Suspense>
        </div>
        <div className="map-kpi left">
          <strong>{kpiEmergency}</strong>
          <span>今日急诊数</span>
          <div className="platform">
            <Activity size={20} />
          </div>
        </div>
        <div className="map-kpi right">
          <strong>{kpiClosed}</strong>
          <span>今日结案数</span>
        </div>
      </div>
    </>
  )
}
