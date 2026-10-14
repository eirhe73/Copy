import { Outlet } from 'react-router-dom'
import { CommandHeader } from './CommandHeader'
import { PlateSubNav } from './PlateSubNav'
import { SystemFooter } from './SystemFooter'

export function CommandLayout() {
  return (
    <div className="app-shell">
      <CommandHeader />
      <PlateSubNav />
      <Outlet />
      <SystemFooter />
    </div>
  )
}
