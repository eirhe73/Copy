import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiSourceNotice } from '../../components/ApiSourceNotice'
import { DashboardPanel } from '../../components/home/DashboardPanel'
import { apiGet } from '../../lib/apiClient'
import {
  formatPatientTime,
  genderBadgeClass,
  genderLabel,
  parsePatientListPayload,
  patientDisplayName,
} from '../../lib/patientDisplay'
import type { PatientRecord } from '../../types/patient'

export function PatientsListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<PatientRecord[]>([])
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      qs.set('per_page', '30')
      qs.set('page', String(page))
      if (keyword.trim()) qs.set('keyword', keyword.trim())
      const raw = await apiGet<unknown>(`/patients?${qs}`)
      const parsed = parsePatientListPayload(raw)
      setRows(parsed.rows)
      setLastPage(parsed.meta.last_page)
      setTotal(parsed.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [keyword, page])

  useEffect(() => {
    void load()
  }, [load])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    if (page === 1) void load()
    else setPage(1)
  }

  return (
    <main className="workspace screen">
      <ApiSourceNotice compact />
      <header className="workspace-heading">
        <div>
          <h2>患者列表</h2>
          <p className="api-muted">在治患者 · 检索与详情 · GET /patients</p>
        </div>
        <Link to="/register" className="btn-primary">
          院前登记
        </Link>
      </header>

      <form className="filter-bar" onSubmit={onSearch}>
        <label className="field">
          <span>关键词</span>
          <input
            type="search"
            placeholder="姓名 / 编号 / 电话 / 身份证"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-ghost" disabled={loading}>
          查询
        </button>
        <span className="api-muted">
          共 {total} 条 · 第 {page}/{lastPage} 页
        </span>
      </form>

      <DashboardPanel title="患者台账">
        {loading ? <p className="api-muted">正在加载…</p> : null}
        {error ? <p className="api-muted">{error}</p> : null}
        {!loading && !error && !rows.length ? (
          <p className="api-muted">暂无患者数据，可先通过院前登记创建。</p>
        ) : null}
        {rows.length ? (
          <div className="business-table table-scroll">
            <table>
              <thead>
                <tr>
                  <th>患者编号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>年龄</th>
                  <th>电话</th>
                  <th>建档时间</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={String(p.id)}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/patient/${encodeURIComponent(String(p.id))}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/patient/${encodeURIComponent(String(p.id))}`)
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <td>{p.patient_code ?? '—'}</td>
                    <td>
                      <strong>{patientDisplayName(p)}</strong>
                    </td>
                    <td>
                      <span className={genderBadgeClass(p.gender)}>{genderLabel(p.gender)}</span>
                    </td>
                    <td>{p.age != null ? `${p.age}` : '—'}</td>
                    <td>{p.phone ?? '—'}</td>
                    <td>{formatPatientTime(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {lastPage > 1 ? (
          <div className="form-footer" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn-ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </button>
          </div>
        ) : null}
      </DashboardPanel>

      <p className="api-muted" style={{ marginTop: 12 }}>
        <Link to="/">返回指挥中心</Link>
      </p>
    </main>
  )
}
