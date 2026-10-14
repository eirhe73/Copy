import type { ComponentType } from 'react'
import { APP_ROUTES } from '../routes/meta'
import { createLegacyPage } from './createLegacyPage'
import { createScaffoldPage } from './createScaffoldPage'
import { HomePage } from './HomePage'
import { PatientDetailPage } from './patients/PatientDetailPage'
import { PatientRegisterPage } from './patients/PatientRegisterPage'
import { PatientsListPage } from './patients/PatientsListPage'

const BUSINESS_PAGES = new Set(['/patients', '/patient/:id', '/register'])

const legacyByPath = Object.fromEntries(
  APP_ROUTES.filter(
    (r) => r.path !== '/' && r.path !== '/login' && r.path !== '/phone' && !BUSINESS_PAGES.has(r.path),
  ).map((r) => [r.path, createLegacyPage(r)]),
) as Record<string, ComponentType>

const phonePage = createScaffoldPage(APP_ROUTES.find((r) => r.path === '/phone')!)

export const routeElements: Record<string, ComponentType> = {
  '/': HomePage,
  '/phone': phonePage,
  '/patients': PatientsListPage,
  '/patient/:id': PatientDetailPage,
  '/register': PatientRegisterPage,
  ...legacyByPath,
}
