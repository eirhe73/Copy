import { useEffect, useState } from 'react'
import type { Hospital3D, Hospitals3DPayload } from './types'

type Props = {
  payload: Hospitals3DPayload
  selected: Hospital3D | null
  onPick: (id: string) => void
  onClear: () => void
}

declare global {
  interface Window {
    hxBackend?: {
      enabled?: () => boolean
      ensureAuth?: (force?: boolean) => Promise<boolean>
      get?: (path: string) => Promise<unknown>
    }
  }
}

export function HospitalInfoPanel({ payload, selected, onPick, onClear }: Props) {
  const [remoteNote, setRemoteNote] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) {
      setRemoteNote(null)
      return
    }
    let cancelled = false
    ;(async () => {
      if (!window.hxBackend?.enabled?.()) return
      const authed = await window.hxBackend.ensureAuth?.(false)
      if (!authed) return
      try {
        const data = (await window.hxBackend.get?.(
          `/organizations/${encodeURIComponent(selected.institutionId)}`,
        )) as { name?: string; org_code?: string } | null
        if (cancelled || !data) return
        if (data.org_code) setRemoteNote(`后端机构编码 ${data.org_code}`)
      } catch {
        /* 静态数据为主 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selected])

  if (!selected) {
    const s = payload.summary
    return (
      <aside className="hx-map-3d-panel">
        <div className="hx-map-3d-panel-empty">
          <p>点击地图上的 <strong>3D 医院</strong> 查看详情</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>或从下方列表选择 · Esc 取消选中</p>
        </div>
        <div className="hx-map-3d-summary">
          <div className="hx-map-3d-stat">
            <span className="k">协作机构</span>
            <strong>{s.hospitalCount}</strong>
          </div>
          <div className="hx-map-3d-stat">
            <span className="k">开放床位</span>
            <strong>{s.bedsOpen}</strong>
          </div>
          <div className="hx-map-3d-stat">
            <span className="k">今日会诊</span>
            <strong>{s.consultationsToday}</strong>
          </div>
          <div className="hx-map-3d-stat">
            <span className="k">今日转诊</span>
            <strong>{s.transfersToday}</strong>
          </div>
        </div>
        <p className="hx-map-3d-list-title">全县机构</p>
        <ul className="hx-map-3d-list">
          {payload.hospitals.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => onPick(h.id)}>
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    )
  }

  const beds = selected.beds
  const occRate =
    beds && beds.open > 0 ? Math.round((beds.occupied / beds.open) * 100) : null

  return (
    <aside className="hx-map-3d-panel">
      <button
        type="button"
        className="hx-map-3d-back"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}
        onClick={onClear}
      >
        ← 返回全县概览
      </button>
      <div className="hx-map-3d-detail">
        <h2>{selected.name}</h2>
        <div className="hx-map-3d-tags">
          {selected.level ? <span className="hx-map-3d-tag">{selected.level}</span> : null}
          <span className="hx-map-3d-tag">机构 ID：{selected.institutionId}</span>
          <span className={`hx-map-3d-tag ${selected.status === 'offline' ? 'offline' : ''}`}>
            {selected.status === 'offline' ? '离线' : '在线'}
          </span>
        </div>
        <dl className="hx-map-3d-dl">
          {selected.address ? (
            <>
              <dt>地址</dt>
              <dd>{selected.address}</dd>
            </>
          ) : null}
          {selected.emergencyPhone ? (
            <>
              <dt>急诊电话</dt>
              <dd>{selected.emergencyPhone}</dd>
            </>
          ) : null}
          {beds ? (
            <>
              <dt>床位占用（开放 {beds.open} / 共 {beds.total}）</dt>
              <dd>
                {beds.occupied} 床占用
                {occRate != null ? `（${occRate}%）` : ''}
                <div className="hx-map-3d-bar">
                  <span style={{ width: `${occRate ?? 0}%` }} />
                </div>
              </dd>
            </>
          ) : null}
          {selected.stats ? (
            <>
              <dt>今日业务（演示）</dt>
              <dd>
                会诊 {selected.stats.consultationsToday} · 转诊 {selected.stats.transfersToday}
              </dd>
            </>
          ) : null}
          {selected.departments?.length ? (
            <>
              <dt>重点科室</dt>
              <dd>{selected.departments.join('、')}</dd>
            </>
          ) : null}
          {remoteNote ? (
            <>
              <dt>后端</dt>
              <dd>{remoteNote}</dd>
            </>
          ) : null}
        </dl>
        <div className="hx-map-3d-actions">
          <a href={`/app.html#/consultations?org=${encodeURIComponent(selected.institutionId)}`}>
            查看会诊队列
          </a>
          <a
            className="secondary"
            href={`/app.html#/organizations?focus=${encodeURIComponent(selected.institutionId)}`}
          >
            进入指挥台 · 机构视图
          </a>
        </div>
      </div>
      <p className="hx-map-3d-list-title" style={{ marginTop: 24 }}>
        切换机构
      </p>
      <ul className="hx-map-3d-list">
        {payload.hospitals.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className={h.id === selected.id ? 'active' : ''}
              onClick={() => onPick(h.id)}
            >
              {h.shortName || h.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
