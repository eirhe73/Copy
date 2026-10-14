import { Link } from 'react-router-dom'
import { ApiSourceNotice } from '../ApiSourceNotice'
import { useAuth } from '../../context/AuthContext'
import { useRouteApi } from '../../hooks/useRouteApi'
import { labelForApiPath } from '../../lib/extractRows'
import type { AppRouteMeta } from '../../routes/meta'
import type { ApiBinding } from '../../routes/apiBindings'
import type { RouteWriteAction } from '../../routes/apiWrites'
import { BusinessTable } from './BusinessTable'
import { RouteWriteBar } from '../forms/RouteWriteBar'

type Props = {
  meta: AppRouteMeta
  bindings: ApiBinding[]
  params: Record<string, string | undefined>
  writes?: RouteWriteAction[]
  subNav?: boolean
  className?: string
}

export function RouteApiWorkspace({
  meta,
  bindings,
  params,
  writes = [],
  subNav = true,
  className = 'workspace',
}: Props) {
  const { ready } = useAuth()
  const { results, loading } = useRouteApi(bindings, params, { enabled: ready })

  return (
    <main className={className}>
      <ApiSourceNotice compact />
      <header className="workspace-heading">
        <div>
          <h2>{meta.title}</h2>
          <p className="api-muted">{meta.modules.join(' · ')}</p>
        </div>
      </header>

      {subNav ? (
        <div className="filter-bar">
          <span className="api-muted">接口直连 Laravel /api/v1</span>
        </div>
      ) : null}

      {!ready ? <p className="api-muted">正在连接后端…</p> : null}
      {ready && loading ? <p className="api-muted">正在加载…</p> : null}

      <div className="panel-grid">
        {results.map((r) => (
          <BusinessTable
            key={r.path}
            title={labelForApiPath(r.path)}
            payload={r.ok ? r.data : undefined}
            error={r.ok ? undefined : r.error}
          />
        ))}
        {!bindings.length ? (
          <section className="u-card">
            <p className="api-muted">未配置 ROUTE_API_BINDINGS：{meta.path}</p>
          </section>
        ) : null}
      </div>

      {writes.length ? (
        <RouteWriteBar actions={writes} params={params} onDone={() => location.reload()} />
      ) : null}

      <p className="api-muted" style={{ marginTop: 12 }}>
        <Link to="/">返回指挥中心</Link>
      </p>
    </main>
  )
}
