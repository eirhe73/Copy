const TIER = ['一级', '二级', '基层'] as const

type Node = {
  id?: string
  name?: string
  tier?: number
  er?: number
  bedsFree?: number
  tight?: boolean
}

type Props = {
  loading?: boolean
  error?: string
  payload?: unknown
}

export function nodesFromCountyPayload(payload: unknown): Node[] {
  if (!payload || typeof payload !== 'object') return []
  const raw = (payload as Record<string, unknown>).nodes
  if (!Array.isArray(raw)) return []
  return raw.filter((n): n is Node => n !== null && typeof n === 'object')
}

export function MapCollabPanel({ loading, error, payload }: Props) {
  const nodes = payload ? nodesFromCountyPayload(payload) : []

  return (
    <aside className="map-collab-panel" aria-label="协作节点">
      <header className="map-collab-head">
        <strong>协作节点</strong>
        <span className="api-muted">{loading ? '加载中…' : `${nodes.length} 个`}</span>
      </header>
      {error ? (
        <p className="api-muted" style={{ padding: 8 }}>
          {error}
        </p>
      ) : null}
      <div className="map-collab-list">
        {nodes.map((node) => {
          const tier = Math.min(2, Math.max(0, Number(node.tier ?? 0)))
          return (
            <div key={String(node.id ?? node.name)} className="map-med-row map-collab-row">
              <span className={`map-med-tier t${tier}`}>{TIER[tier]}</span>
              <span className="map-med-row-name" title={node.name}>
                {node.name ?? '—'}
              </span>
              <span className="map-med-row-stat">
                <em>急诊</em>
                <strong className={(node.er ?? 0) >= 5 ? 'warn' : ''}>{node.er ?? '—'}</strong>
              </span>
              <span className="map-med-row-stat">
                <em>空床</em>
                <strong>{node.bedsFree ?? '—'}</strong>
              </span>
              <span className={`map-med-row-dot ${node.tight ? 'busy' : ''}`} />
            </div>
          )
        })}
        {!loading && !error && !nodes.length ? (
          <p className="api-muted" style={{ padding: 8 }}>
            暂无带坐标的机构节点
          </p>
        ) : null}
      </div>
    </aside>
  )
}
