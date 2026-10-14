/** 后端英文状态 → 首页展示中文（与线上一致） */
export function displayVehicleStatus(raw: unknown): string {
  const s = String(raw ?? '').trim()
  const u = s.toUpperCase()
  if (s === '出警中' || u === 'DISPATCHING' || u === 'ON_MISSION') return '出警中'
  if (s === '站内待命') return '空闲中'
  if (u === 'AVAILABLE') return '空闲中'
  if (s === '维护中' || u === 'MAINTENANCE' || u === 'OFFLINE') return '维护中'
  if (s === '不能调用' || u === 'UNAVAILABLE' || u === 'DISABLED') return '不能调用'
  if (s === '空闲中' || u === 'IDLE' || u === 'STANDBY') return '空闲中'
  return s || '—'
}

export function vehicleBucket(raw: unknown): '出警中' | '空闲中' | '不能调用' | '其他' {
  const d = displayVehicleStatus(raw)
  if (d === '出警中') return '出警中'
  if (d === '空闲中' || d === '站内待命') return '空闲中'
  if (d === '不能调用' || d === '维护中') return '不能调用'
  return '其他'
}
