import type { ReactNode } from 'react'

type Props = {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function DashboardPanel({ title, action, className = '', children }: Props) {
  return (
    <section className={`panel ${className}`.trim()}>
      <header className="panel-title">
        <span className="v-mark">V</span>
        <h2>{title}</h2>
        {action ? <div className="panel-action">{action}</div> : null}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}
