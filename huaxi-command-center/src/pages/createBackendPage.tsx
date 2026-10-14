import { useParams } from 'react-router-dom'
import { ApiDataPanel } from '../components/ApiDataPanel'
import { PageScaffold } from '../components/PageScaffold'
import type { AppRouteMeta } from '../routes/meta'
import { ROUTE_API_BINDINGS } from '../routes/apiBindings'

export function createBackendPage(meta: AppRouteMeta) {
  const bindings = ROUTE_API_BINDINGS[meta.path] ?? []

  function BackendPage() {
    const params = useParams()
    const paramRecord: Record<string, string | undefined> = { ...params }

    return (
      <PageScaffold meta={meta}>
        {bindings.length ? (
          <section className="panel" style={{ gridColumn: '1 / -1' }}>
            <h3>后端 API 数据</h3>
            <p className="api-muted">本页由 src 直接请求 /backend-api/v1，非演示 scenario。</p>
            <ApiDataPanel bindings={bindings} params={paramRecord} />
          </section>
        ) : (
          <section className="panel">
            <p className="api-muted">该路由尚未配置 ROUTE_API_BINDINGS，请在 src/routes/apiBindings.ts 补充。</p>
          </section>
        )}
      </PageScaffold>
    )
  }
  BackendPage.displayName = meta.title
  return BackendPage
}
