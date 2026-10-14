import { useState } from 'react'
import { apiDelete, apiPost, apiPut } from '../../lib/apiClient'
import type { RouteWriteAction } from '../../routes/apiWrites'
import { resolveApiPath } from '../../routes/apiBindings'

type Props = {
  actions: RouteWriteAction[]
  params: Record<string, string | undefined>
  onDone?: () => void
}

function resolveWritePath(template: string, params: Record<string, string | undefined>, promptId?: boolean) {
  let id = params.id ?? params.token ?? params.sessionId
  if (promptId && !id) {
    id = window.prompt('请输入资源 ID（或 token）') ?? undefined
  }
  return resolveApiPath(template, { ...params, id, token: params.token ?? id, sessionId: id })
}

export function RouteWriteBar({ actions, params, onDone }: Props) {
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: RouteWriteAction) {
    setBusy(true)
    setMsg(null)
    try {
      const path = resolveWritePath(action.pathTemplate, params, action.promptId)
      const body =
        typeof action.body === 'function' ? action.body() : (action.body ?? {})
      if (action.method === 'POST') await apiPost(path, body)
      else if (action.method === 'PUT') await apiPut(path, body)
      else await apiDelete(path)
      setMsg(`${action.label} 成功`)
      onDone?.()
    } catch (e) {
      setMsg(String(e instanceof Error ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="u-card" style={{ marginTop: 16 }}>
      <header className="workspace-heading">
        <h3>写接口</h3>
      </header>
      <div className="filter-bar">
        {actions.map((a) => (
          <button key={a.pathTemplate} type="button" className="btn-primary" disabled={busy} onClick={() => run(a)}>
            {a.label}
          </button>
        ))}
      </div>
      {msg ? <p className="api-muted">{msg}</p> : null}
    </section>
  )
}
