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

export function savePatient(form: PatientForm, submit: boolean) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  const id = form.task120Id || form.eventId || `DRAFT-${Date.now()}`
  if (submit) {
    localStorage.setItem(
      `huaxi-dispatch-patient-${id}`,
      JSON.stringify({ ...form, savedAt: new Date().toISOString() }),
    )
  }
  const task = form.task120Id || form.eventId || id
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return submit
    ? `已提交登记（演示）· 已关联任务 ${task}`
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
  return s ? `/#/consultations?${s}` : '/#/consultations'
}

export async function loadEvents(): Promise<{ updatedAt: string; activeCount: number; events: DispatchEvent[] }> {
  return fetch('/api/dispatch-live.json', { cache: 'no-store' }).then((r) => r.json())
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
