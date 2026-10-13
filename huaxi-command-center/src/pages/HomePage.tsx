import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../routes/meta'

const quickLinks = APP_ROUTES.filter((r) =>
  ['/dispatch', '/warning', '/critical', '/patients', '/consultations', '/medical-quality'].includes(
    r.path,
  ),
)

export function HomePage() {
  return (
    <main className="workspace page-scaffold">
      <h2>一体化指挥中心</h2>
      <div className="path-badge">#/</div>
      <div className="home-hero">
        <section className="panel">
          <h3>大屏概览（占位）</h3>
          <ul>
            <li>县域地图 + 救护车实时点位（Leaflet）</li>
            <li>今日急救事件 / 在途转运 / 预警待处置</li>
            <li>机构床位占用与 ICU 远程单元状态</li>
            <li>24 小时县域智慧重症事件趋势（ECharts / Recharts）</li>
          </ul>
        </section>
        <section className="panel">
          <h3>快捷入口</h3>
          <ul>
            {quickLinks.map((r) => (
              <li key={r.path}>
                <Link to={r.path}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
