import { useEffect, useState } from 'react'

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
  const [open, setOpen] = useState(false)
  const [mapFullPage, setMapFullPage] = useState(() =>
    document.body.classList.contains('hx-page-map-only'),
  )

  useEffect(() => {
    const mainMap = document.querySelector('.dashboard-center .main-map')
    if (!mainMap) return
    mainMap.classList.toggle('map-nodes-open', open && !mapFullPage)
    return () => mainMap.classList.remove('map-nodes-open')
  }, [open, mapFullPage])

  useEffect(() => {
    const onMapPage = (ev: Event) => {
      const active = !!(ev as CustomEvent<{ active?: boolean }>).detail?.active
      if (active) {
        setOpen(false)
        document.querySelector('.dashboard-center .main-map')?.classList.remove('map-nodes-open')
      }
      setMapFullPage((prev) => (prev === active ? prev : active))
    }
    window.addEventListener('hx-map-page', onMapPage)
    return () => window.removeEventListener('hx-map-page', onMapPage)
  }, [])

  if (mapFullPage) return null

  return (
    <>
      <button
        type="button"
        className="map-med-tab"
        aria-expanded={open}
        aria-label="协作节点"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <span className="map-med-tab-label">协作节点</span>
        <span className="map-med-tab-count">{loading ? '…' : nodes.length}</span>
      </button>
      <div
        className="map-med-backdrop"
        role="presentation"
        onClick={() => setOpen(false)}
        onKeyDown={undefined}
      />
      <aside className="map-med-sidepanel" aria-label="协作节点一览">
        <header className="map-med-side-head">
          <strong>协作节点</strong>
          <button type="button" className="map-med-close" aria-label="收起" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        <p className="map-med-side-tip">数据来自县域协作 API · 点击地图院区可查看详情</p>
        {error ? (
          <p className="api-muted" style={{ padding: 8 }}>
            {error}
          </p>
        ) : null}
        <div className="map-med-side-list">
          {nodes.map((node) => {
            const tier = Math.min(2, Math.max(0, Number(node.tier ?? 0)))
            return (
              <button
                key={String(node.id ?? node.name)}
                type="button"
                className="map-med-row map-collab-row"
              >
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
              </button>
            )
          })}
          {!loading && !error && !nodes.length ? (
            <p className="api-muted" style={{ padding: 8 }}>
              暂无带坐标的机构节点
            </p>
          ) : null}
        </div>
      </aside>
    </>
  )
}
