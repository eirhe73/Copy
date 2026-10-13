import { apiGet } from './apiClient'

export type CollabNode = {
  id: string
  name: string
  tier: 0 | 1 | 2
  lng: number
  lat: number
}

export type CollabLink = { from: string; to: string; flow?: number }

export type CountyMapCollab = {
  nodes: CollabNode[]
  links: CollabLink[]
  erToday?: number
}

function tier(n: unknown): 0 | 1 | 2 {
  const t = Number(n)
  if (t === 1) return 1
  if (t >= 2) return 2
  return 0
}

export async function fetchCountyMapCollab(region: string): Promise<CountyMapCollab> {
  const raw = await apiGet<Record<string, unknown>>(`/dashboard/county-map?region=${encodeURIComponent(region)}`)
  const nodesRaw = Array.isArray(raw.nodes) ? raw.nodes : []
  const linksRaw = Array.isArray(raw.links) ? raw.links : []
  const nodes: CollabNode[] = nodesRaw
    .map((n) => {
      if (!n || typeof n !== 'object') return null
      const o = n as Record<string, unknown>
      const lng = Number(o.lng)
      const lat = Number(o.lat)
      if (Number.isNaN(lng) || Number.isNaN(lat)) return null
      return {
        id: String(o.id ?? o.org_code ?? ''),
        name: String(o.name ?? o.org_name ?? '节点'),
        tier: tier(o.tier),
        lng,
        lat,
      }
    })
    .filter((n): n is CollabNode => n !== null && n.id !== '')
  const links: CollabLink[] = []
  for (const l of linksRaw) {
    if (!l || typeof l !== 'object') continue
    const o = l as Record<string, unknown>
    const from = String(o.from ?? '')
    const to = String(o.to ?? '')
    if (!from || !to) continue
    const link: CollabLink = { from, to }
    if (o.flow != null && !Number.isNaN(Number(o.flow))) link.flow = Number(o.flow)
    links.push(link)
  }
  const erToday = raw.erToday != null ? Number(raw.erToday) : undefined
  return { nodes, links, erToday: Number.isNaN(erToday) ? undefined : erToday }
}
