import type { CollabNodeDetail } from './campusMapInfoPanel'
import type { HomeRegion } from '../context/HomeRegionContext'
import { nodesFromCountyPayload } from './countyCollabNodes'

type CollabLink = { from: string; to: string }

type GisRegionBlock = {
  nodes?: unknown[]
  links?: CollabLink[]
  erToday?: number
}

export type GisCollabStaticPack = Record<string, GisRegionBlock>

function finiteCoord(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizeTier(t: unknown): 0 | 1 | 2 {
  const n = Number(t)
  if (n === 1) return 1
  if (n >= 2) return 2
  return 0
}

/** 地图始终用 gis-collab 坐标；API 只覆盖名称/急诊/床位等统计 */
function nodeFromStatic(raw: unknown): CollabNodeDetail | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const lng = finiteCoord(o.lng)
  const lat = finiteCoord(o.lat)
  const id = String(o.id ?? '')
  if (!id || lng == null || lat == null) return null
  return {
    id,
    name: String(o.name ?? '协作节点'),
    tier: normalizeTier(o.tier),
    lng,
    lat,
    er: Number(o.er ?? 0) || 0,
    bedsFree: Number(o.bedsFree ?? 0) || 0,
    tight: Boolean(o.tight),
  }
}

export function buildMapCollabPack(
  region: HomeRegion,
  staticPack: GisCollabStaticPack | undefined,
  apiCounty: unknown | undefined,
): { nodes: CollabNodeDetail[]; links: CollabLink[] } | undefined {
  const block = staticPack?.[region] ?? staticPack?.weiyuan
  const template = (block?.nodes ?? [])
    .map(nodeFromStatic)
    .filter((n): n is CollabNodeDetail => n != null)
  if (!template.length) return undefined

  /** 飞线拓扑以静态 gis-collab 为准（from/to 与 template.id 一致） */
  const staticLinks = (block?.links ?? []).filter(
    (l) => l && typeof l.from === 'string' && typeof l.to === 'string',
  )

  const apiNodes = apiCounty ? nodesFromCountyPayload(apiCounty) : []
  const apiById = new Map(apiNodes.map((n) => [String(n.id ?? ''), n]))
  const apiByName = new Map(apiNodes.map((n) => [String(n.name ?? '').trim(), n]))

  const merged: CollabNodeDetail[] = template.map((sn) => {
    const api = apiById.get(String(sn.id)) ?? apiByName.get(String(sn.name).trim())
    if (!api) return sn
    return {
      ...sn,
      id: sn.id,
      name: String(api.name ?? sn.name),
      tier: normalizeTier(api.tier ?? sn.tier),
      lng: sn.lng,
      lat: sn.lat,
      er: api.er != null ? Number(api.er) : sn.er,
      bedsFree: api.bedsFree != null ? Number(api.bedsFree) : sn.bedsFree,
      tight: api.tight != null ? Boolean(api.tight) : sn.tight,
    }
  })

  const nodeIds = new Set(merged.map((n) => n.id))
  const links = staticLinks.filter((l) => nodeIds.has(l.from) && nodeIds.has(l.to))

  return { nodes: merged, links }
}
