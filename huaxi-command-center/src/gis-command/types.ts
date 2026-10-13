export type RegionKey = 'dafang' | 'weiyuan'

export type CollabNode = {
  id: string
  name: string
  tier: 0 | 1 | 2
  lng: number
  lat: number
  er: number
  bedsFree: number
  tight: boolean
}

export type CollabLink = {
  from: string
  to: string
  /** 转诊流量，决定连线粗细 */
  flow: number
}

export type RegionPayload = {
  erToday: number
  nodes: CollabNode[]
  links: CollabLink[]
}

export type GisCollabResponse = {
  updatedAt: string
  dafang: RegionPayload
  weiyuan: RegionPayload
}

/** 院前 GPS 演示点（与 /api/vehicles-gps.json 对齐） */
export type DispatchVehicleMarker = {
  id: string
  plate: string
  lng: number
  lat: number
  status: string
  etaMinutes: number | null
}
