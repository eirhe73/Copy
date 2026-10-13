import type { ComponentType } from 'react'
import { APP_ROUTES } from '../routes/meta'
import { createScaffoldPage } from './createScaffoldPage'
import { HomePage } from './HomePage'

const scaffoldByPath = Object.fromEntries(
  APP_ROUTES.filter((r) => r.path !== '/').map((r) => [r.path, createScaffoldPage(r)]),
) as Record<string, ReturnType<typeof createScaffoldPage>>

export const routeElements: Record<string, ComponentType> = {
  '/': HomePage,
  ...scaffoldByPath,
}
