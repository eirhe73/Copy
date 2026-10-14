import { asList } from './apiClient'

const NESTED_LIST_KEYS = ['events', 'vehicles', 'items', 'records', 'todos', 'list', 'data'] as const

export function rowsFromPayload(payload: unknown): Record<string, unknown>[] {
  const list = asList(payload)
  if (list.length) {
    return list.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object')
  }
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>
    for (const key of NESTED_LIST_KEYS) {
      const nested = p[key]
      if (Array.isArray(nested)) {
        return nested.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object')
      }
    }
  }
  return []
}

export function summarizeFieldValue(value: unknown): string {
  if (value == null) return '—'
  if (Array.isArray(value)) return `${value.length} 条`
  if (typeof value === 'object') return '（详情）'
  const s = String(value)
  return s.length > 120 ? `${s.slice(0, 117)}…` : s
}

export function labelForApiPath(path: string): string {
  const clean = path.replace(/^\//, '').split('?')[0] ?? path
  const parts = clean.split('/').filter(Boolean)
  const last = parts[parts.length - 1] ?? clean
  const map: Record<string, string> = {
    'county-map': '县域地图',
    todos: '待办事项',
    'dispatch-live': '实时调度',
    events: '调度事件',
    'case-push': '病例推送',
    ambulances: '救护车',
    gps: '车辆 GPS',
    summary: '预警摘要',
    statistics: '预警统计',
    'critical-values': '危急值',
    'closed-loop': '处置闭环',
    warnings: '预警列表',
    beds: '床位',
    wards: '病区',
    vitals: '体征',
    alerts: '告警',
    streams: '监控流',
    patients: '患者',
    overview: '床位总览',
    distribution: '床位分布',
    consultations: '会诊',
    doctors: '会诊医生',
    transfers: '转诊',
    organizations: '机构',
    departments: '科室',
    centers: '救治中心',
    messages: '消息',
    notifications: '通知',
    'qc-standards': '质控标准',
    'sla-records': 'SLA 记录',
    'qc-issues': '质控问题',
    'qc-issues-report': '质控报表',
    devices: '设备',
    inspections: '巡检',
    preferences: '偏好设置',
    'notification-channels': '通知渠道',
    tasks: '协同任务',
    'clinical-records': '临床记录',
  }
  if (map[last]) return map[last]
  return parts.join(' · ') || path
}

export function columnsFromRows(rows: Record<string, unknown>[], max = 8): string[] {
  if (!rows.length) return []
  const keys = new Set<string>()
  for (const row of rows.slice(0, 20)) {
    Object.keys(row).forEach((k) => {
      if (!k.startsWith('_') && k !== 'meta') keys.add(k)
    })
  }
  const preferred = [
    'id',
    'name',
    'title',
    'status',
    'stage',
    'level',
    'ownerName',
    'institutionId',
    'departmentId',
    'createdAt',
    'updatedAt',
    'at',
  ]
  const ordered = preferred.filter((k) => keys.has(k))
  const rest = [...keys].filter((k) => !ordered.includes(k)).slice(0, max - ordered.length)
  return [...ordered, ...rest].slice(0, max)
}

export function cellText(value: unknown): string {
  return summarizeFieldValue(value)
}
