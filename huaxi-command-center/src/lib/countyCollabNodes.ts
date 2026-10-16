/** 县域协作地图节点（静态 gis-collab / API county-map 共用字段） */
export type CountyCollabNode = {
  id?: string
  name?: string
  tier?: number
  lng?: unknown
  lat?: unknown
  er?: number
  bedsFree?: number
  tight?: boolean
}

export function nodesFromCountyPayload(payload: unknown): CountyCollabNode[] {
  if (!payload || typeof payload !== 'object') return []
  const raw = (payload as Record<string, unknown>).nodes
  if (!Array.isArray(raw)) return []
  return raw.filter((n): n is CountyCollabNode => n !== null && typeof n === 'object')
}
