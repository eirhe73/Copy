import { Link } from 'react-router-dom'
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
  const { ready } = useAuth()
  const { results } = useRouteApi(bindings, undefined, { enabled: ready })

  const ambulances = results.find((r) => r.path.includes('/ambulances'))
  const live = results.find((r) => r.path.includes('dispatch-live'))
  const gps = results.find((r) => r.path.includes('vehicles/gps'))
  const beds = results.find((r) => r.path.includes('beds/overview'))

  let vehicles = rowsFromPayload(ambulances?.ok ? ambulances.data : [])
  if (!vehicles.length) vehicles = rowsFromPayload(gps?.ok ? gps.data : [])

  const liveObj =
    live?.ok && live.data && typeof live.data === 'object' ? (live.data as Record<string, unknown>) : null
  const kpiEmergency = String(liveObj?.activeCount ?? liveObj?.emergencyToday ?? '—')
  const kpiClosed = String(liveObj?.closedToday ?? liveObj?.closedCount ?? '—')

  const bedsObj =
    beds?.ok && beds.data && typeof beds.data === 'object' ? (beds.data as Record<string, unknown>) : null

  return (
    <>
      <p className="api-muted" style={{ margin: '8px 12px 0', gridColumn: '1 / -1' }}>
        当前为 <strong>src-shell</strong> 迁移版，与线上首页不完全一致。验收请打开{' '}
        <a href="/">index.html（/#/）</a>。
      </p>
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
          erPatients={Number(bedsObj?.erPatients ?? 17)}
          erBedsTotal={Number(bedsObj?.erBedsTotal ?? 28)}
          erBedsFree={Number(bedsObj?.erBedsFree ?? 18)}
          icuPatients={Number(bedsObj?.icuPatients ?? 18)}
          icuBedsTotal={Number(bedsObj?.icuBedsTotal ?? 26)}
          icuBedsFree={Number(bedsObj?.icuBedsFree ?? 8)}
        />
      </div>

      <div className="dashboard-center">
        <HomeCountyMap kpiEmergency={kpiEmergency} kpiClosed={kpiClosed} bedsOverview={beds?.ok ? beds.data : undefined} />
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
