import type { GisCollabResponse } from './types'

const API = '/api/gis-collab.json'

export async function fetchGisCollab(): Promise<GisCollabResponse> {
  const res = await fetch(API, { cache: 'no-store' })
  if (!res.ok) throw new Error('协同数据加载失败')
  return res.json() as Promise<GisCollabResponse>
}

/** 预留：替换为真实后端 WebSocket / REST */
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
