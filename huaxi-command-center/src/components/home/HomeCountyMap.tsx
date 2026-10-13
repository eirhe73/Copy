import { Activity } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useHomeRegion } from '../../context/HomeRegionContext'
import { useHomeMapEnhancers } from '../../hooks/useHomeMapEnhancers'
import { CenterMetricsBar } from './CenterMetricsBar'
import { MapLegend, MapTools } from './MapChrome'

const MapScene = lazy(() => import('../../smart-city/MapScene').then((m) => ({ default: m.MapScene })))

type Props = {
  kpiEmergency?: string
  kpiClosed?: string
  bedsOverview?: unknown
}

export function HomeCountyMap({ kpiEmergency = '—', kpiClosed = '—', bedsOverview }: Props) {
  const { region, setRegion } = useHomeRegion()
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
      <div className="center-caption">
        {region === 'dafang' ? '大方汇总指标 · 协作节点已标注' : '威远协作 · 协作节点已标注'}
      </div>
    </>
  )
}
