import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { RouteApiWorkspace } from '../components/data/RouteApiWorkspace'
/** 所有非独立业务页均走 RouteApiWorkspace（直连 API，无 scenario） */
import type { AppRouteMeta } from '../routes/meta'
import { ROUTE_API_BINDINGS } from '../routes/apiBindings'
import { ROUTE_WRITE_ACTIONS } from '../routes/apiWrites'

export function createLegacyPage(meta: AppRouteMeta, className?: string) {
  const bindings = ROUTE_API_BINDINGS[meta.path] ?? []
  const writes = ROUTE_WRITE_ACTIONS[meta.path] ?? []

  function LegacyPage() {
    const params = useParams()
    const paramRecord = useMemo(() => ({ ...params }), [params])

    return (
      <RouteApiWorkspace
        meta={meta}
        bindings={bindings}
        params={paramRecord}
        writes={writes}
        className={className ?? 'workspace screen'}
      />
    )
  }
  LegacyPage.displayName = meta.title
  return LegacyPage
}
