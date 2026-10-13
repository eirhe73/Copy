import { fetchCountyMapCollab } from '../lib/countyMapCollab'
import type { GisCollabResponse } from './types'

const STATIC_API = '/api/gis-collab.json'

function regionFromLocation(): string {
  try {
    const q = new URLSearchParams(location.search).get('region')
    if (q === 'dafang' || q === 'weiyuan') return q
  } catch {
    /* ignore */
  }
  return 'weiyuan'
}

async function fetchFromBackend(region: string): Promise<GisCollabResponse | null> {
  try {
    const live = await fetchCountyMapCollab(region)
    return {
      updatedAt: new Date().toISOString(),
      [region]: {
        erToday: live.erToday ?? 0,
        nodes: live.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          tier: n.tier,
          lng: n.lng,
          lat: n.lat,
          er: 0,
          bedsFree: 0,
          tight: false,
        })),
        links: live.links,
      },
    } as GisCollabResponse
  } catch {
    return null
  }
}

export async function fetchGisCollab(): Promise<GisCollabResponse> {
  const region = regionFromLocation()
  const live = await fetchFromBackend(region)
  if (live) return live
  const res = await fetch(STATIC_API, { cache: 'no-store' })
  if (!res.ok) throw new Error('协同数据加载失败')
  return res.json() as Promise<GisCollabResponse>
}

/** 轮询：优先 Laravel county-map，失败回退静态 JSON */
export function subscribeGisCollab(onData: (data: GisCollabResponse) => void, intervalMs = 15000) {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    try {
      onData(await fetchGisCollab())
    } catch {
      /* 静默，下次轮询 */
    }
  }
  tick()
  const id = window.setInterval(tick, intervalMs)
  return () => {
    stopped = true
    clearInterval(id)
  }
}
