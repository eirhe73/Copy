const VEHICLE_STATUS_LABELS: Record<string, string> = {
  STANDBY: '待命',
  DISPATCHING: '出警中',
  ON_MISSION: '出警中',
  ON_SCENE: '现场处置',
  RETURNING: '返院途中',
  TRANSPORT: '转运中',
  AVAILABLE: '空闲中',
  IDLE: '空闲中',
  MAINTENANCE: '维护中',
  OFFLINE: '维护中',
  UNAVAILABLE: '不能调用',
  DISABLED: '不能调用',
}

/** 后端英文状态 → 首页展示中文（与 AmbulanceService / dispatch-hub 一致） */
export function displayVehicleStatus(raw: unknown, statusLabel?: unknown): string {
  const label = String(statusLabel ?? '').trim()
  if (label) return label
  const s = String(raw ?? '').trim()
  if (!s) return '—'
  const u = s.toUpperCase()
  if (VEHICLE_STATUS_LABELS[u]) return VEHICLE_STATUS_LABELS[u]
  if (s === '出警中' || s === '现场处置' || s === '返院途中') return s
  if (s === '站内待命' || s === '待命') return '空闲中'
  if (s === '维护中') return '维护中'
  if (s === '不能调用') return '不能调用'
  if (s === '空闲中') return '空闲中'
  return s
}

export function vehicleOnDispatch(raw: unknown, statusLabel?: unknown): boolean {
  const d = displayVehicleStatus(raw, statusLabel)
  return d === '出警中' || d === '现场处置' || d === '返院途中' || d === '转运中'
}

export function vehicleBucket(raw: unknown, statusLabel?: unknown): '出警中' | '空闲中' | '不能调用' | '其他' {
  const d = displayVehicleStatus(raw, statusLabel)
  if (vehicleOnDispatch(raw, statusLabel)) return '出警中'
  if (d === '空闲中' || d === '待命' || d === '站内待命') return '空闲中'
  if (d === '不能调用' || d === '维护中') return '不能调用'
  return '其他'
}
