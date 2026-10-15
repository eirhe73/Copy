import { useEffect, useState } from 'react'
import { apiGet } from '../lib/apiClient'
import type { ApiBinding } from '../routes/apiBindings'
import { resolveApiPath } from '../routes/apiBindings'

type Result = { path: string; ok: boolean; data?: unknown; error?: string }

type Props = {
  bindings: ApiBinding[]
  params?: Record<string, string | undefined>
}

export function ApiDataPanel({ bindings, params = {} }: Props) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const out: Result[] = []
      for (const b of bindings) {
        const path = resolveApiPath(b.path, params)
        try {
          const data = await apiGet(path)
          out.push({ path, ok: true, data })
          
        } catch (e) {
          out.push({ path, ok: false, error: String(e instanceof Error ? e.message : e) })
        }
      }
      if (!cancelled) {
        setResults(out)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bindings, params])

  if (loading) return <p className="api-muted">正在加载后端数据…</p>

  return (
    <div className="api-panels">
      {results.map((r) => (
        <section key={r.path} className={`panel api-panel ${r.ok ? 'ok' : 'fail'}`}>
          <header className="api-panel-head">
            <code>{r.path}</code>
            <span>{r.ok ? '200' : r.error}</span>
          </header>
          {r.ok ? (
            <pre className="api-json">{JSON.stringify(r.data, null, 2).slice(0, 4000)}</pre>
          ) : null}
        </section>
      ))}
    </div>
  )
}
