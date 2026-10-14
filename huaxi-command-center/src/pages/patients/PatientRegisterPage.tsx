import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiSourceNotice } from '../../components/ApiSourceNotice'
import { DashboardPanel } from '../../components/home/DashboardPanel'
import { useAuth } from '../../context/AuthContext'
import { apiPost } from '../../lib/apiClient'
import type { DispatchPatientForm } from '../../types/patient'

const emptyForm = (): DispatchPatientForm => ({
  name: '',
  gender: 'MALE',
  age: '',
  phone: '',
  chiefComplaint: '',
  task120Id: '',
  eventId: '',
  vehicleId: '',
  vehiclePlate: '',
})

export function PatientRegisterPage() {
  const { ready, authenticated, error: authError } = useAuth()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<DispatchPatientForm>(() => ({
    ...emptyForm(),
    task120Id: searchParams.get('task120Id') ?? searchParams.get('task') ?? '',
    eventId: searchParams.get('eventId') ?? searchParams.get('event') ?? '',
    vehicleId: searchParams.get('vehicleId') ?? '',
    vehiclePlate: searchParams.get('vehiclePlate') ?? searchParams.get('plate') ?? '',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function update<K extends keyof DispatchPatientForm>(key: K, value: DispatchPatientForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: FormEvent, isDraft: boolean) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('请填写患者姓名')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const body = {
        name: form.name.trim(),
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone.trim() || undefined,
        chiefComplaint: form.chiefComplaint.trim() || undefined,
        task120Id: form.task120Id.trim() || undefined,
        eventId: form.eventId.trim() || undefined,
        vehicleId: form.vehicleId.trim() || undefined,
        vehiclePlate: form.vehiclePlate.trim() || undefined,
        isDraft: isDraft ? 1 : 0,
      }
      await apiPost<unknown>('/dispatch/patients', body)
      const task = form.task120Id || form.eventId || '—'
      setMessage(
        isDraft
          ? `草稿已保存（isDraft=1）· 任务 ${task}`
          : `登记成功 · POST /dispatch/patients · 任务 ${task}`,
      )
      if (!isDraft) {
        setForm(emptyForm())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="workspace screen">
      <ApiSourceNotice compact />
      <header className="workspace-heading">
        <div>
          <h2>患者登记</h2>
          <p className="api-muted">院前 / 车上就近登记 · POST /dispatch/patients</p>
        </div>
        <Link to="/patients" className="btn-ghost">
          查看患者列表
        </Link>
      </header>

      <DashboardPanel title="登记信息">
        {ready && !authenticated ? (
          <p className="api-muted">
            请先登录后再登记。{authError ? `（${authError}）` : ''}{' '}
            <Link to="/login">去登录</Link>
          </p>
        ) : null}
        <form className="form-grid" onSubmit={(e) => void onSubmit(e, false)}>
          <label className="field">
            <span>姓名 *</span>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="患者姓名"
            />
          </label>
          <label className="field">
            <span>性别 *</span>
            <select value={form.gender} onChange={(e) => update('gender', e.target.value as 'MALE' | 'FEMALE')}>
              <option value="MALE">男</option>
              <option value="FEMALE">女</option>
            </select>
          </label>
          <label className="field">
            <span>年龄</span>
            <input
              type="number"
              min={0}
              max={150}
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
            />
          </label>
          <label className="field">
            <span>联系电话</span>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="11 位手机号" />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>主诉</span>
            <textarea
              rows={3}
              value={form.chiefComplaint}
              onChange={(e) => update('chiefComplaint', e.target.value)}
              placeholder="现场情况、症状描述"
            />
          </label>
          <label className="field">
            <span>120 任务号</span>
            <input value={form.task120Id} onChange={(e) => update('task120Id', e.target.value)} />
          </label>
          <label className="field">
            <span>事件 ID</span>
            <input value={form.eventId} onChange={(e) => update('eventId', e.target.value)} />
          </label>
          <label className="field">
            <span>车辆 ID</span>
            <input value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} />
          </label>
          <label className="field">
            <span>车牌</span>
            <input value={form.vehiclePlate} onChange={(e) => update('vehiclePlate', e.target.value)} />
          </label>

          {error ? <p className="api-muted" style={{ gridColumn: '1 / -1', color: 'var(--danger, #c0392b)' }}>{error}</p> : null}
          {message ? <p className="api-muted" style={{ gridColumn: '1 / -1' }}>{message}</p> : null}

          <div className="form-footer" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="btn-ghost" disabled={submitting} onClick={(e) => void onSubmit(e, true)}>
              存草稿
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '提交中…' : '正式提交'}
            </button>
          </div>
        </form>
      </DashboardPanel>

      <p className="api-muted" style={{ marginTop: 12 }}>
        <Link to="/">返回指挥中心</Link>
      </p>
    </main>
  )
}
