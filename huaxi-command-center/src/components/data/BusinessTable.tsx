import { cellText, columnsFromRows, rowsFromPayload, summarizeFieldValue } from '../../lib/extractRows'

type Props = {
  title: string
  payload: unknown
  error?: string
}

export function BusinessTable({ title, payload, error }: Props) {
  if (error) {
    return (
      <section className="panel">
        <header className="panel-title">
          <span className="v-mark">V</span>
          <h2>{title}</h2>
        </header>
        <div className="panel-body">
          <p className="api-muted">{error}</p>
        </div>
      </section>
    )
  }

  const rows = rowsFromPayload(payload)
  if (!rows.length) {
    const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
    return (
      <section className="panel">
        <header className="panel-title">
          <span className="v-mark">V</span>
          <h2>{title}</h2>
        </header>
        <div className="panel-body business-table table-scroll">
          {obj ? (
            <table>
              <tbody>
                {Object.entries(obj).map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{summarizeFieldValue(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="api-muted">暂无列表数据</p>
          )}
        </div>
      </section>
    )
  }

  const cols = columnsFromRows(rows)
  return (
    <section className="panel">
      <header className="panel-title">
        <span className="v-mark">V</span>
        <h2>{title}</h2>
        <div className="panel-action">
          <span className="api-muted">{rows.length} 条</span>
        </div>
      </header>
      <div className="panel-body business-table table-scroll">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={String(row.id ?? i)}>
                {cols.map((c) => (
                  <td key={c}>{cellText(row[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
