import type { PatientRecord } from '../types/patient'

const GENDER_ZH: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  male: '男',
  female: '女',
}

export function genderLabel(g?: string | null) {
  if (!g) return '—'
  return GENDER_ZH[g] ?? g
}

export function genderBadgeClass(g?: string | null) {
  const u = String(g || '').toUpperCase()
  if (u === 'MALE') return 'badge teal'
  if (u === 'FEMALE') return 'badge amber'
  return 'badge muted'
}

export function formatPatientTime(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

export function patientDisplayName(p: PatientRecord) {
  return p.real_name || p.patient_code || String(p.id)
}

export function patientDetailFields(p: PatientRecord): { label: string; value: string }[] {
  return [
    { label: '患者编号', value: p.patient_code ?? '—' },
    { label: '姓名', value: p.real_name ?? '—' },
    { label: '性别', value: genderLabel(p.gender) },
    { label: '年龄', value: p.age != null ? `${p.age} 岁` : '—' },
    { label: '出生日期', value: p.birth_date ?? '—' },
    { label: '联系电话', value: p.phone ?? '—' },
    { label: '身份证号', value: p.id_card ?? '—' },
    { label: '住址', value: p.address ?? '—' },
    { label: '既往史', value: p.medical_history ?? '—' },
    { label: '过敏史', value: p.allergy_history ?? '—' },
    { label: '建档时间', value: formatPatientTime(p.created_at) },
  ]
}

export function parsePatientListPayload(raw: unknown): {
  rows: PatientRecord[]
  meta: { current_page: number; last_page: number; total: number }
} {
  let rows: PatientRecord[] = []
  let meta = { current_page: 1, last_page: 1, total: 0 }

  if (Array.isArray(raw)) {
    rows = raw as PatientRecord[]
    meta.total = rows.length
    return { rows, meta }
  }

  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.data)) rows = o.data as PatientRecord[]
    else if (Array.isArray(o.list)) rows = o.list as PatientRecord[]
    const m = o.meta as Record<string, unknown> | undefined
    if (m) {
      meta = {
        current_page: Number(m.current_page ?? 1),
        last_page: Number(m.last_page ?? 1),
        total: Number(m.total ?? rows.length),
      }
    } else {
      meta.total = rows.length
    }
  }

  return { rows, meta }
}

export function patientFromUnknown(raw: unknown): PatientRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if ('real_name' in o || 'patient_code' in o || 'id' in o) return o as PatientRecord
  if (o.data && typeof o.data === 'object') return patientFromUnknown(o.data)
  return null
}
