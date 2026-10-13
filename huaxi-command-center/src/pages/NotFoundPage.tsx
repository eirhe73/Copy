import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="workspace not-found">
      <h2>页面不存在</h2>
      <Link to="/">返回指挥中心</Link>
    </main>
  )
}
