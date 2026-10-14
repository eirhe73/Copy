export type DispatchEvent = {
  id: string
  task120Id: string
  level: string
  chiefComplaint: string
  pickupAddress: string
  destination: string
  vehicleId: string
  vehiclePlate: string
  status: string
  startedAt: string
  etaHospitalMinutes: number
  etaPatientMinutes?: number
  scorePlan?: string
  treatPlan?: string
}

export type PatientForm = {
  eventId: string
  task120Id: string
  vehicleId: string
  vehiclePlate: string
  name: string
  gender: string
  age: string
  phone: string
  chiefComplaint: string
}

export type TabId = 'live' | 'events' | 'ambulances' | 'register'

const DRAFT_KEY = 'huaxi-dispatch-register-draft'

export function emptyForm(): PatientForm {
  return {
    eventId: '',
    task120Id: '',
    vehicleId: '',
    vehiclePlate: '',
    name: '',
    gender: '男',
    age: '',
    phone: '',
    chiefComplaint: '',
  }
}

export function hashQuery(): URLSearchParams {
  const raw = location.hash.replace(/^#/, '')
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
  return new URLSearchParams(q)
}

export function tabFromHash(): TabId | 'monitor' {
  const id = location.hash.replace(/^#\/?/, '').split('?')[0]
  if (id === 'events' || id === 'ambulances' || id === 'register' || id === 'monitor') return id
  return 'live'
}

export function buildHash(
  tab: TabId,
  ctx: Partial<Pick<PatientForm, 'eventId' | 'task120Id' | 'vehicleId' | 'vehiclePlate' | 'chiefComplaint'>> = {},
) {
  const q = new URLSearchParams()
  if (ctx.eventId) q.set('event', ctx.eventId)
  if (ctx.task120Id) q.set('task', ctx.task120Id)
  if (ctx.vehicleId) q.set('vehicle', ctx.vehicleId)
  if (ctx.vehiclePlate) q.set('plate', ctx.vehiclePlate)
  if (ctx.chiefComplaint) q.set('complaint', ctx.chiefComplaint)
  const s = q.toString()
  return s ? `#${tab}?${s}` : `#${tab}`
}

export function contextFromHash() {
  const q = hashQuery()
  return {
    eventId: q.get('event') || '',
    task120Id: q.get('task') || '',
    vehicleId: q.get('vehicle') || '',
    vehiclePlate: q.get('plate') || '',
    chiefComplaint: q.get('complaint') || '',
  }
}

export function loadDraft(): PatientForm | null {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return { ...emptyForm(), ...JSON.parse(raw) }
  } catch {
    return null
  }
}

export async function savePatient(form: PatientForm, submit: boolean): Promise<string> {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  const id = form.task120Id || form.eventId || `DRAFT-${Date.now()}`
  const task = form.task120Id || form.eventId || id
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (submit && window.hxBackend?.enabled?.()) {
    try {
      await window.hxBackend.ensureAuth()
      await window.hxBackend.post('/dispatch/patients', {
        name: form.name,
        gender: form.gender === '女' ? 'FEMALE' : 'MALE',
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone,
        chiefComplaint: form.chiefComplaint,
        task120Id: form.task120Id,
        eventId: form.eventId,
        vehicleId: form.vehicleId,
        vehiclePlate: form.vehiclePlate,
        isDraft: 0,
      })
      return `已提交登记 · 后端 POST /dispatch/patients · 任务 ${task}`
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return `后端提交失败：${msg}（草稿仍保留在本地）`
    }
  }

  if (submit) {
    localStorage.setItem(
      `huaxi-dispatch-patient-${id}`,
      JSON.stringify({ ...form, savedAt: new Date().toISOString() }),
    )
  }
  return submit
    ? `已提交登记（本地演示）· 任务 ${task}`
    : `草稿已保存 · ${time} · 任务 ${task || '未填'}`
}

export function consultHref(
  ctx: Partial<Pick<PatientForm, 'task120Id' | 'vehicleId' | 'vehiclePlate' | 'chiefComplaint'>> = {},
) {
  const q = new URLSearchParams()
  if (ctx.task120Id) q.set('task', ctx.task120Id)
  if (ctx.vehiclePlate) q.set('plate', ctx.vehiclePlate)
  if (ctx.vehicleId) q.set('vehicle', ctx.vehicleId)
  if (ctx.chiefComplaint) q.set('complaint', ctx.chiefComplaint)
  const s = q.toString()
  return s ? `/app.html#/consultations?${s}` : '/app.html#/consultations'
}

export async function loadEvents(): Promise<{ updatedAt: string; activeCount: number; events: DispatchEvent[] }> {
  const [live, amb] = await Promise.all([
    fetch('/api/dispatch-live.json', { cache: 'no-store' }).then((r) => r.json()),
    fetch('/api/dispatch-ambulances.json', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => null),
  ])
  const plates = new Map<string, string>()
  for (const a of (amb?.ambulances ?? []) as Array<{ currentEventId?: string; plate?: string }>) {
    if (a?.currentEventId && a?.plate) plates.set(a.currentEventId, a.plate)
  }
  const events = ((live.events ?? []) as DispatchEvent[]).map((ev) => ({
    ...ev,
    vehiclePlate: ev.vehiclePlate || plates.get(ev.id) || '',
  }))
  return { updatedAt: live.updatedAt, activeCount: live.activeCount, events }
}

export function formatClock(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function statusTone(status: string) {
  if (status.includes('出警')) return 'run'
  if (status.includes('现场') || status.includes('处置')) return 'scene'
  if (status.includes('待命')) return 'idle'
  if (status.includes('返院')) return 'run'
  return 'run'
}

const LEVEL_LABELS: Record<string, string> = {
  RISK_HIGH: '高风险',
  RISK_MEDIUM: '中风险',
  RISK_LOW: '低风险',
  TRIAGE_I: 'Ⅰ 级',
  TRIAGE_II: 'Ⅱ 级',
  TRIAGE_III: 'Ⅲ 级',
  TRIAGE_IV: 'Ⅳ 级',
}

export function levelLabel(level: string) {
  if (!level) return '—'
  return LEVEL_LABELS[level] ?? level
}

const STATUS_LABELS: Record<string, string> = {
  STAGE_CREATED: '已接警',
  STAGE_ENROUTE: '出警中',
  STAGE_SCENE: '现场处置',
  STAGE_TRANSPORT: '转运中',
  STAGE_CLOSED: '已结束',
  STANDBY: '待命',
  DISPATCHING: '出警中',
  ON_SCENE: '现场处置',
  RETURNING: '返院途中',
}

export function statusLabel(status: string) {
  if (!status) return '—'
  return STATUS_LABELS[status] ?? status
}

export function etaText(minutes?: number | null) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes) || minutes <= 0) return '—'
  return `${minutes} 分钟`
}

const CHANNEL_LABELS: Record<string, string> = {
  CHANNEL_120: '120 接入',
  CHANNEL_NORMAL: '普通接入',
}

export function channelLabel(channel?: string) {
  if (!channel) return ''
  return CHANNEL_LABELS[channel] ?? channel
}

export function vehicleLabel(plate?: string | null) {
  return plate && plate.trim() ? plate : '待派车'
}
