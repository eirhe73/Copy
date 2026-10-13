import type { AppRouteMeta } from '../routes/meta'
import { RouteApiWorkspace } from '../components/data/RouteApiWorkspace'
import { ROUTE_API_BINDINGS } from '../routes/apiBindings'

export function createScaffoldPage(meta: AppRouteMeta) {
  const bindings = ROUTE_API_BINDINGS[meta.path] ?? []

  function ScaffoldPage() {
    return (
      <RouteApiWorkspace
        meta={meta}
        bindings={bindings}
        params={{}}
        subNav={false}
        className="workspace phone-demo screen"
      />
    )
  }
  ScaffoldPage.displayName = meta.title
  return ScaffoldPage
}
