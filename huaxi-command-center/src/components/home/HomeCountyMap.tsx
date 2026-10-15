import { Activity } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useHomeRegion, type HomeRegion } from '../../context/HomeRegionContext'
import { useHomeMapEnhancers } from '../../hooks/useHomeMapEnhancers'
import { useRouteApi } from '../../hooks/useRouteApi'
import type { ApiBinding } from '../../routes/apiBindings'
import { CenterMetricsBar } from './CenterMetricsBar'
import { MapCollabPanel } from './MapCollabPanel'
import { MapLegend, MapTools } from './MapChrome'

const COUNTY_MAP_BINDINGS: ApiBinding[] = [{ method: 'GET', path: '/dashboard/county-map' }]

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
  const countyBindings = useMemo(() => COUNTY_MAP_BINDINGS, [])
  const { results, loading: countyLoading } = useRouteApi(countyBindings, {}, { enabled: ready && authenticated })
  const countyResult = results[0]
  const [demoCounty, setDemoCounty] = useState<unknown>(undefined)

  useEffect(() => {
    if (authenticated) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/gis-collab.json', { cache: 'no-store' })
        if (!res.ok) return
        const pack = (await res.json()) as Record<string, { nodes?: unknown[]; links?: unknown[] }>
        if (cancelled) return
        setDemoCounty(pack)
      } catch {
        /* demo 静态包可选 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authenticated])

  const countyFromApi = countyResult?.ok ? countyResult.data : undefined
  const county = useMemo(() => {
    if (countyFromApi) return countyFromApi
    if (!demoCounty || typeof demoCounty !== 'object') return undefined
    const pack = demoCounty as Record<string, { nodes?: unknown[]; links?: unknown[]; erToday?: number }>
    const block = pack[region as HomeRegion] ?? pack.weiyuan
    if (!block?.nodes?.length) return undefined
    return { erToday: block.erToday ?? 0, nodes: block.nodes, links: block.links ?? [] }
  }, [countyFromApi, demoCounty, region])

  const countyError =
    authenticated && countyResult && !countyResult.ok ? countyResult.error : undefined

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
            error={countyError}
            payload={county}
          />
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
