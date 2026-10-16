/**
 * 校验 backend-api-catalog 中全部 GET（占位符用种子数据首条记录）
 * 需：cd backend && php artisan serve && php artisan migrate --seed
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.HX_API_BASE || 'http://62.234.128.72:7824/api'
const V1 = `${BASE}/v1`
const USER = process.env.HX_API_USER || 'admin'
const PASS = process.env.HX_API_PASS || '123456'

function loadGetPaths() {
  const src = readFileSync(join(__dir, '../public/assets/backend/backend-api-catalog.js'), 'utf8')
  const paths = []
  const re = /method:\s*'GET',\s*path:\s*'([^']+)'/g
  let m
  while ((m = re.exec(src))) {
    let p = m[1]
    if (p === '/auth/login') continue
    paths.push(p)
  }
  return [...new Set(paths)]
}

function unwrap(body) {
  if (body && typeof body === 'object' && body.code === 200 && 'data' in body) return body.data
  return body
}

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.list && Array.isArray(payload.list)) return payload.list
  return []
}

function pickId(row) {
  if (!row || typeof row !== 'object') return '1'
  return String(
    row.transfer_code ||
      row.sessionId ||
      row.session_id ||
      row.patient_code ||
      row.event_id ||
      row.eventId ||
      row.device_id ||
      row.stream_id ||
      row.vehicle_id ||
      row.id ||
      '1',
  )
}

async function login() {
  const res = await fetch(`${V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  })
  if (!res.ok) throw new Error(`login failed ${res.status}`)
  const data = unwrap(await res.json())
  if (!data?.token) throw new Error('no token')
  return data.token
}

async function get(token, path) {
  const res = await fetch(`${V1}/${path.replace(/^\//, '')}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body }
}

async function buildSamples(token) {
  const s = { id: '1', transferNo: 'T20250101001' }
  const q = async (path) => {
    const { ok, body } = await get(token, path)
    return ok ? unwrap(body) : null
  }
  const transfers = asList(await q('transfers?per_page=5'))
  if (transfers[0]) {
    s.transferId = String(transfers[0].id)
    s.transferNo = transfers[0].transfer_code || s.transferNo
  }
  const consult = await q('consultations?pageNum=1&pageSize=5')
  const clist = consult?.list || asList(consult)
  if (clist[0]) {
    s.sessionId = pickId(clist[0])
    s.token = clist[0].room_token || clist[0].roomToken || 'demo-room'
  }
  const patients = asList(await q('patients?per_page=1'))
  s.patientId = pickId(patients[0])
  s.id = s.patientId
  const warnings = await q('warnings?pageNum=1&pageSize=1')
  s.warningId = pickId(warnings?.list?.[0])
  const events = asList(await q('dispatch/events?per_page=1'))
  s.eventId = pickId(events[0])
  const ev = asList(await q('emergency-events?per_page=1'))
  s.emergencyEventId = pickId(ev[0])
  const dev = asList(await q('devices?per_page=1'))
  s.deviceId = pickId(dev[0])
  const streams = asList(await q('monitoring/streams'))
  s.streamId = pickId(streams[0])
  const amb = asList(await q('ambulances'))
  s.vehicleId = pickId(amb[0])
  const orgs = asList(await q('organizations?per_page=1'))
  s.orgId = pickId(orgs[0])
  const qc = asList(await q('qc-issues?per_page=1'))
  s.qcIssueId = pickId(qc[0])
  const centers = asList(await q('centers'))
  s.centerId = pickId(centers[0])
  return s
}

function resolvePath(template, s) {
  const map = {
    transferNo: s.transferNo,
    transfer: s.transferId || '1',
    id: s.id,
    eventId: s.eventId,
    sessionId: s.sessionId || '1',
    token: s.token || 'demo-room',
    deviceId: s.deviceId,
    streamId: s.streamId,
    vehicleId: s.vehicleId,
    qc_issue: s.qcIssueId,
    emergency_event: s.emergencyEventId,
    vehicle: s.vehicleId,
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(map[key] || s[key] || '1'))
}

async function main() {
  const paths = loadGetPaths()
  console.log(`Probing ${paths.length} GET endpoints…`)

  try {
    const h = await fetch(`${BASE}/health`)
    if (!h.ok) throw new Error('health fail')
  } catch {
    console.error('Backend not reachable. cd backend && php artisan serve')
    process.exit(1)
  }

  const token = await login()
  console.log('JWT OK')
  const samples = await buildSamples(token)

  let failed = 0
  for (const path of paths) {
    const resolved = resolvePath(path, samples)
    const { ok, status, body } = await get(token, resolved)
    if (!ok) {
      failed++
      console.log('✗', resolved, status, JSON.stringify(body).slice(0, 120))
    }
  }
  console.log(failed ? `${failed}/${paths.length} failed` : `All ${paths.length} GET OK`)
  process.exit(failed ? 1 : 0)
}

main()
