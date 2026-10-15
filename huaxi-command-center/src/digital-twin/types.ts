export type HospitalTier = 0 | 1 | 2 | 3

export type Hospital3D = {
  id: string
  institutionId: string
  name: string
  shortName: string
  lng: number
  lat: number
  tier: HospitalTier
  level?: string
  address?: string
  emergencyPhone?: string
  beds?: { total: number; open: number; occupied: number }
  stats?: { consultationsToday: number; transfersToday: number }
  status?: 'online' | 'offline'
  departments?: string[]
}

export type Hospitals3DPayload = {
  region: 'weiyuan' | 'dafang'
  summary: {
    title: string
    hospitalCount: number
    bedsOpen: number
    consultationsToday: number
    transfersToday: number
  }
  hospitals: Hospital3D[]
}
