import { Link } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { ApiSourceNotice } from '../components/ApiSourceNotice'
import { useAuth } from '../context/AuthContext'
import { HomeCountyMap } from '../components/home/HomeCountyMap'
import { HomeCurrentPanel } from '../components/home/HomeCurrentPanel'
import { HomeDashboardRight } from '../components/home/HomeDashboardRight'
import { DashboardPanel } from '../components/home/DashboardPanel'
import { useRouteApi } from '../hooks/useRouteApi'
import { rowsFromPayload } from '../lib/extractRows'
import { displayVehicleStatus, vehicleBucket } from '../lib/vehicleStatus'
import { ROUTE_API_BINDINGS } from '../routes/apiBindings'

const bindings = ROUTE_API_BINDINGS['/'] ?? []

const VEHICLE_BUCKETS = ['出警中', '空闲中', '不能调用'] as const

function HomeDashboard() {
  const { ready, authenticated } = useAuth()
  const [countyErToday, setCountyErToday] = useState<number | undefined>()
  const onCountyMap = useCallback((p: { erToday?: number }) => {
    setCountyErToday(p.erToday)
  }, [])
  const { results } = useRouteApi(bindings, undefined, { enabled: ready && authenticated })

  const ambulances = results.find((r) => r.path.includes('/ambulances'))
  const live = results.find((r) => r.path.includes('dispatch-live'))
  const gps = results.find((r) => r.path.includes('vehicles/gps'))
  const beds = results.find((r) => r.path.includes('beds/overview'))

  let vehicles = rowsFromPayload(ambulances?.ok ? ambulances.data : [])
  if (!vehicles.length) vehicles = rowsFromPayload(gps?.ok ? gps.data : [])

  const liveObj =
    live?.ok && live.data && typeof live.data === 'object' ? (live.data as Record<string, unknown>) : null
  const kpiEmergency = String(
    countyErToday ?? liveObj?.activeCount ?? liveObj?.emergencyToday ?? '—',
  )
  const kpiClosed = String(liveObj?.closedToday ?? liveObj?.closedCount ?? '—')

  const bedsObj =
    beds?.ok && beds.data && typeof beds.data === 'object' ? (beds.data as Record<string, unknown>) : null

  const bedNum = (key: string) => {
    const v = bedsObj?.[key]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v)
    return undefined
  }

  return (
    <>
      <ApiSourceNotice />
      <main className="dashboard screen">
      <div className="dashboard-left">
        <DashboardPanel
          title="车辆概览"
          className="vehicle-panel"
          action={
            <Link to="/dispatch" className="btn-ghost">
              调度
            </Link>
          }
        >
          <div className="vehicle-totals">
            {VEHICLE_BUCKETS.map((status) => (
              <Link key={status} to={`/dispatch?status=${encodeURIComponent(status)}`}>
                <span>{status}</span>
                <strong>{vehicles.filter((v) => vehicleBucket(v.status) === status).length}</strong>
              </Link>
            ))}
          </div>
          <div className="vehicle-table table-scroll">
            <table>
              <thead>
                <tr>
                  <th>车辆状态</th>
                  <th>派诊中</th>
                  <th>车辆编号</th>
                  <th>所属分站</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.slice(0, 8).map((v, i) => (
                  <tr key={String(v.id ?? i)}>
                    <td>{displayVehicleStatus(v.status)}</td>
                    <td className="cyan-text">{displayVehicleStatus(v.status) === '出警中' ? '是' : '否'}</td>
                    <td>{String(v.plate ?? v.plateNo ?? v.id ?? '—')}</td>
                    <td>{String(v.stationName ?? v.station ?? v.institutionId ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
        <HomeCurrentPanel
          erPatients={bedNum('erPatients')}
          erBedsTotal={bedNum('erBedsTotal')}
          erBedsFree={bedNum('erBedsFree')}
          icuPatients={bedNum('icuPatients')}
          icuBedsTotal={bedNum('icuBedsTotal')}
          icuBedsFree={bedNum('icuBedsFree')}
        />
      </div>

      <div className="dashboard-center">
        <HomeCountyMap
          kpiEmergency={kpiEmergency}
          kpiClosed={kpiClosed}
          bedsOverview={beds?.ok ? beds.data : undefined}
          onCountyMap={onCountyMap}
        />
      </div>

      <div className="dashboard-right">
        <HomeDashboardRight results={results} />
      </div>
    </main>
    </>
  )
}

export function HomePage() {
  return <HomeDashboard />
}
