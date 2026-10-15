import { Navigate, Route, Routes } from 'react-router-dom'
import { CommandHeader } from './layout/CommandHeader'
import { CommandLayout } from './layout/CommandLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { routeElements } from './pages/routePages'
import { APP_ROUTES } from './routes/meta'

function StandaloneFrame({ path }: { path: string }) {
  const Element = routeElements[path]
  if (!Element) return null
  return (
    <div className="app-shell">
      <CommandHeader />
      <Element />
    </div>
  )
}

export default function App() {
  const shellRoutes = APP_ROUTES.filter((r) => !r.standalone && r.path !== '/login')
  const standaloneRoutes = APP_ROUTES.filter((r) => r.standalone && r.path !== '/login')

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {standaloneRoutes.map((meta) => (
        <Route key={meta.path} path={meta.path} element={<StandaloneFrame path={meta.path} />} />
      ))}

      <Route element={<CommandLayout />}>
        <Route path="/map" element={<HomePage />} />
        {shellRoutes.map((meta) => {
          if (meta.path === '/mobile') {
            return (
              <Route key={meta.path} path={meta.path} element={<Navigate to="/coordination" replace />} />
            )
          }
          const Element = routeElements[meta.path]
          if (!Element) return null
          return <Route key={meta.path} path={meta.path} element={<Element />} />
        })}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
