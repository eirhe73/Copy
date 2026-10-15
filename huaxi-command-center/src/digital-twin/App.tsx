import { useCallback, useEffect, useMemo, useState } from 'react'
import { HospitalInfoPanel } from './HospitalInfoPanel'
import { HospitalMap3D } from './HospitalMap3D'
import type { Hospitals3DPayload } from './types'

export default function App() {
  const [payload, setPayload] = useState<Hospitals3DPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/hospitals-3d.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('hospitals-3d.json')
        return r.json()
      })
      .then((data: Hospitals3DPayload) => setPayload(data))
      .catch(() => setError('无法加载 hospitals-3d.json'))
  }, [])

  const selected = useMemo(
    () => payload?.hospitals.find((h) => h.id === selectedId) ?? null,
    [payload, selectedId],
  )

  const onSelect = useCallback((id: string | null) => setSelectedId(id), [])
  const onPick = useCallback((id: string) => setSelectedId(id), [])

  return (
    <div className="hx-map-3d-light">
      <header className="hx-map-3d-header">
        <div>
          <h1>{payload?.summary.title ?? '县域 3D 医院地图'}</h1>
          <p>点击 3D 楼块查看机构信息 · 威远县 GeoJSON 底图</p>
        </div>
        <a className="hx-map-3d-back" href="/app.html">
          返回指挥台
        </a>
      </header>
      <div className="hx-map-3d-body">
        {error ? (
          <p style={{ padding: 24 }}>{error}</p>
        ) : payload ? (
          <>
            <HospitalMap3D
              region={payload.region}
              hospitals={payload.hospitals}
              selectedId={selectedId}
              onSelect={onSelect}
            />
            <HospitalInfoPanel
              payload={payload}
              selected={selected}
              onPick={onPick}
              onClear={() => setSelectedId(null)}
            />
          </>
        ) : (
          <p style={{ padding: 24, color: '#94a3b8' }}>加载地图数据…</p>
        )}
      </div>
    </div>
  )
}
