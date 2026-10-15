import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../lib/apiClient'
import type { ApiBinding } from '../routes/apiBindings'
import { resolveApiPath } from '../routes/apiBindings'

export type ApiLoadResult = {
  binding: ApiBinding
  path: string
  ok: boolean
  data?: unknown
  error?: string
}

const EMPTY_PARAMS: Record<string, string | undefined> = {}

type Options = { enabled?: boolean }

export function useRouteApi(
  bindings: ApiBinding[],
  params: Record<string, string | undefined> = EMPTY_PARAMS,
  options: Options = {},
) {
  const enabled = options.enabled !== false
  const pathKey = useMemo(
    () => bindings.map((b) => resolveApiPath(b.path, params)).join('|'),
    [bindings, params],
  )
  const paramsKey = useMemo(() => JSON.stringify(params), [params])

  const [results, setResults] = useState<ApiLoadResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const out: ApiLoadResult[] = []
      for (const binding of bindings) {
        const path = resolveApiPath(binding.path, params)
        try {
          const data = await apiGet(path)
          out.push({ binding, path, ok: true, data })
        } catch (e) {
          out.push({
            binding,
            path,
            ok: false,
            error: String(e instanceof Error ? e.message : e),
          })
        }
        if (cancelled) return
      }
      if (!cancelled) {
        setResults(out)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathKey, paramsKey, enabled])

  return { results, loading: enabled ? loading : true, reload: () => setLoading(true) }
}
