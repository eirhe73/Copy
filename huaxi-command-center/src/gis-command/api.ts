import { fetchCountyMapCollab } from '../lib/countyMapCollab'
import type { GisCollabResponse } from './types'

function regionFromLocation(): string {
  try {
    const q = new URLSearchParams(location.search).get('region')
    if (q === 'dafang' || q === 'weiyuan') return q
  } catch {
    /* ignore */
  }
  return 'weiyuan'
}

/** 直连后端 county-map，不再回退静态 Mock */
export async function fetchGisCollab(): Promise<GisCollabResponse> {
  const region = regionFromLocation()
  const live = await fetchCountyMapCollab(region)
  return {
    updatedAt: new Date().toISOString(),
    [region]: {
      erToday: live.erToday ?? 0,
      nodes: live.nodes,
      links: live.links,
    },
  } as GisCollabResponse
}

/** 轮询：直连 Laravel county-map */
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
