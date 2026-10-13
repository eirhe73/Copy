export type PatientRecord = {
  id: number | string
  patient_code?: string
  real_name?: string
  gender?: string
  birth_date?: string | null
  age?: number | null
  id_card?: string | null
  phone?: string | null
  address?: string | null
  medical_history?: string | null
  allergy_history?: string | null
  created_at?: string | null
}

export type PatientListMeta = {
  current_page?: number
  last_page?: number
  total?: number
  per_page?: number
}

export type DispatchPatientForm = {
  name: string
  gender: 'MALE' | 'FEMALE'
  age: string
  phone: string
  chiefComplaint: string
  task120Id: string
  eventId: string
  vehicleId: string
  vehiclePlate: string
}
