import type { Database } from '@/shared/types/database.types'

type Tables = Database['public']['Tables']
type Views = Database['public']['Views']

export type Employee = Tables['employees']['Row']
export type EmployeeDirectoryRow = Views['vw_employee_directory']['Row']
export type EmployeeStatus = 'active' | 'terminated' | 'onboarding'

export interface EmployeeFilters {
  search: string
  statuses: EmployeeStatus[]
  jobProfiles: string[]
  projects: string[]
  sites: string[]
  hireFrom: string | null
  hireTo: string | null
  terminationFrom: string | null
  terminationTo: string | null
  // Personas activas sin cuenta de Nómina; solo para RRHH y Nómina.
  withoutPayrollAccount: boolean
}

export type EmployeeColumnKey =
  'job_profile_name' | 'project_name' | 'site' | 'hire_date' | 'termination_date'

// Nombre y estatus siempre se muestran, por eso no están aquí.
export const EMPLOYEE_COLUMNS: {
  key: EmployeeColumnKey
  label: string
  visibleByDefault: boolean
  // La sede y las fechas laborales son exclusivas de RRHH.
  hrOnly: boolean
}[] = [
  { key: 'job_profile_name', label: 'Puesto actual', visibleByDefault: true, hrOnly: false },
  { key: 'project_name', label: 'Proyecto', visibleByDefault: false, hrOnly: false },
  { key: 'site', label: 'Ubicación', visibleByDefault: true, hrOnly: true },
  { key: 'hire_date', label: 'Alta', visibleByDefault: true, hrOnly: true },
  { key: 'termination_date', label: 'Baja', visibleByDefault: true, hrOnly: true },
]

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  terminated: 'Inactivo',
  onboarding: 'En integración',
}
