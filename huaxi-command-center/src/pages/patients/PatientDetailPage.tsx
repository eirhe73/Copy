import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiSourceNotice } from '../../components/ApiSourceNotice'
import { DashboardPanel } from '../../components/home/DashboardPanel'
import { apiGet } from '../../lib/apiClient'
import { genderBadgeClass, genderLabel, patientDetailFields, patientFromUnknown } from '../../lib/patientDisplay'
import type { PatientRecord } from '../../types/patient'

export function PatientDetailPage() {
  const { id } = useParams()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('缺少患者 ID')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const raw = await apiGet<unknown>(`/patients/${encodeURIComponent(id)}`)
        const p = patientFromUnknown(raw)
        if (!p) throw new Error('响应格式无效')
        if (!cancelled) setPatient(p)
      } catch (e) {
        if (!cancelled) {
          setPatient(null)
          setError(e instanceof Error ? e.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const fields = patient ? patientDetailFields(patient) : []

  return (
    <main className="workspace screen">
      <ApiSourceNotice compact />
      <header className="workspace-heading">
        <div>
          <h2>{patient?.real_name ?? '患者详情'}</h2>
          <p className="api-muted">
            GET /patients/{id} · 编号 {patient?.patient_code ?? '—'}
          </p>
        </div>
        {patient ? (
          <span className={genderBadgeClass(patient.gender)}>{genderLabel(patient.gender)}</span>
        ) : null}
      </header>

      <DashboardPanel title="基本信息">
        {loading ? <p className="api-muted">正在加载…</p> : null}
        {error ? (
          <p className="api-muted">
            {error.includes('404') ? '未找到该患者（远程可能无此 ID）。' : error}
          </p>
        ) : null}
        {patient && !loading ? (
          <div className="business-table">
            <table>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.label}>
                    <th style={{ width: '28%' }}>{f.label}</th>
                    <td>{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DashboardPanel>

      {patient ? (
        <DashboardPanel title="关联入口">
          <nav className="filter-bar">
            <Link to="/beds" className="btn-ghost">
              床位总览
            </Link>
            <Link to="/warning" className="btn-ghost">
              预警中心
            </Link>
            <Link to="/consultations" className="btn-ghost">
              远程会诊
            </Link>
            <Link to="/transfers" className="btn-ghost">
              转诊协同
            </Link>
          </nav>
        </DashboardPanel>
      ) : null}

      <p className="api-muted" style={{ marginTop: 12 }}>
        <Link to="/patients">返回患者列表</Link>
        {' · '}
        <Link to="/">指挥中心</Link>
      </p>
    </main>
  )
}
