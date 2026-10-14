import type { AppRouteMeta } from '../routes/meta'

type Props = {
  meta: AppRouteMeta
  children?: React.ReactNode
}

export function PageScaffold({ meta, children }: Props) {
  return (
    <main className="workspace page-scaffold">
      <h2>{meta.title}</h2>
      <div className="path-badge">#/{meta.path.replace(/^\//, '')}</div>
      <p className="api-muted" style={{ margin: '0 0 8px' }}>
        模块：{meta.modules.join(' · ')}
      </p>
      <div className="panel-grid">
        <section className="panel">
          <h3>待实现模块</h3>
          <ul>
            {meta.modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
        {children}
      </div>
    </main>
  )
}
