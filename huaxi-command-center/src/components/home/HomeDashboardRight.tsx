import { Link } from 'react-router-dom'
import type { ApiLoadResult } from '../../hooks/useRouteApi'
import { rowsFromPayload } from '../../lib/extractRows'
import { DashboardPanel } from './DashboardPanel'

type Props = {
  results: ApiLoadResult[]
}

function findResult(results: ApiLoadResult[], needle: string) {
  return results.find((r) => r.path.includes(needle))
}

export function HomeDashboardRight({ results }: Props) {
  const live = findResult(results, 'dispatch-live')
  const warnings = findResult(results, 'warnings')
  const critical = findResult(results, 'critical/alerts')

  const events = live?.ok ? rowsFromPayload(live.data) : []
  const warningRows = warnings?.ok ? rowsFromPayload(warnings.data) : []
  const criticalRows = critical?.ok ? rowsFromPayload(critical.data) : []

  return (
    <>
      <DashboardPanel
        title="今日急救调度事件"
        action={
          <Link to="/patients" className="btn-ghost">
            更多
          </Link>
        }
      >
        <div className="event-feed">
          {!live?.ok ? (
            <p className="api-muted">{live?.error ?? '加载中…'}</p>
          ) : events.length ? (
            events.slice(0, 8).map((ev) => {
              const time = String(ev.startedAt ?? ev.createdAt ?? '').slice(11, 19) || '—'
              const channel =
                ev.source === '120' || ev.scorePlan === 'CHANNEL_120' ? '120信息同步' : '现场信息登记'
              const dest = String(ev.destination ?? ev.pickupAddress ?? ev.institutionId ?? '接入')
              const chief = String(ev.chiefComplaint ?? ev.title ?? '').trim()
              return (
                <Link key={String(ev.id)} to={`/patient/${ev.id ?? ''}`} className="event-feed-item">
                  <time>{time}</time>
                  <span>
                    <em>{channel}</em>，{dest}
                    {chief ? `，主诉：${chief}` : ''}
                  </span>
                </Link>
              )
            })
          ) : (
            <p className="api-muted">暂无进行中的调度事件</p>
          )}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="24小时院内评分预警"
        action={
          <Link to="/warning" className="btn-ghost">
            更多
          </Link>
        }
      >
        <div className="event-feed">
          {!warnings?.ok ? (
            <p className="api-muted">{warnings?.error ?? '加载中…'}</p>
          ) : warningRows.length ? (
            warningRows.slice(0, 6).map((row, i) => (
              <Link key={String(row.id ?? i)} to="/warning" className="event-feed-item">
                <span>
                  {String(row.patientName ?? row.name ?? '患者')} · {String(row.level ?? row.score ?? 'NEWS')}{' '}
                  {String(row.status ?? row.stage ?? '')}
                </span>
              </Link>
            ))
          ) : (
            <p className="api-muted">暂无 24 小时内评分预警</p>
          )}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="24小时县域智慧重症事件"
        action={
          <Link to="/critical" className="btn-ghost">
            更多
          </Link>
        }
      >
        <div className="event-feed">
          {!critical?.ok ? (
            <p className="api-muted">{critical?.error ?? '加载中…'}</p>
          ) : criticalRows.length ? (
            criticalRows.slice(0, 6).map((row, i) => (
              <Link key={String(row.id ?? i)} to="/critical" className="event-feed-item">
                <span>{String(row.title ?? row.message ?? row.note ?? '重症事件')}</span>
              </Link>
            ))
          ) : (
            <p className="api-muted">暂无县域重症事件</p>
          )}
        </div>
      </DashboardPanel>
    </>
  )
}
