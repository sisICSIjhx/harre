import type { EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import {
  filesInSharePoint,
  getSharePointFileUrl,
  uploadToSharePoint,
} from '@/features/employees/services/employee-files.api'
import type { EmployeeFilters } from '@/features/employees/types/employee.types'
import { supabase } from '@/shared/lib/supabase'

export class EmployeeConflictError extends Error {
  constructor() {
    super('Otra persona modificó este expediente. Al recargar se descartará tu captura.')
    this.name = 'EmployeeConflictError'
  }
}

export class DuplicateEmployeeNumberError extends Error {
  constructor() {
    super('Ese número de empleado ya existe.')
    this.name = 'DuplicateEmployeeNumberError'
  }
}

const UNIQUE_VIOLATION = '23505'
const SIGNED_URL_SECONDS = 60
const DOCUMENTS_BUCKET = 'employee-documents'
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const PHOTO_TYPES = ['image/jpeg', 'image/png']
const PHOTO_DOCUMENT_TYPE = 'Fotografía'

export async function listEmployees(filters: EmployeeFilters) {
  let query = supabase.from('vw_employee_directory').select('*').order('employee_number').limit(500)

  if (filters.statuses.length) query = query.in('employment_status', filters.statuses)
  if (filters.jobProfiles.length) query = query.in('job_profile_name', filters.jobProfiles)
  if (filters.projects.length) query = query.in('project_name', filters.projects)
  if (filters.sites.length) query = query.in('site', filters.sites)
  if (filters.hireFrom) query = query.gte('hire_date', filters.hireFrom)
  if (filters.hireTo) query = query.lte('hire_date', filters.hireTo)
  if (filters.terminationFrom) query = query.gte('termination_date', filters.terminationFrom)
  if (filters.terminationTo) query = query.lte('termination_date', filters.terminationTo)
  if (filters.withoutPayrollAccount) {
    query = query.eq('employment_status', 'active').eq('has_payroll_account', false)
  }
  // Se eliminan los caracteres con significado en la sintaxis de filtros de PostgREST.
  const search = filters.search.replace(/[,()*%\\"]/g, ' ').trim()
  if (search) {
    query = query.or(`employee_number.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

function distinctSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => !!value))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
}

// Solo valores que existen en el directorio: elegir otro dejaría la tabla vacía.
export async function listEmployeeFilterOptions() {
  const { data, error } = await supabase
    .from('vw_employee_directory')
    .select('job_profile_name, project_name, site')
    .limit(1000)
  if (error) throw error
  return {
    jobProfiles: distinctSorted(data.map((row) => row.job_profile_name)),
    projects: distinctSorted(data.map((row) => row.project_name)),
    sites: distinctSorted(data.map((row) => row.site)),
  }
}

export async function getEmployee(id: string) {
  const [employee, directory] = await Promise.all([
    supabase.from('employees').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('vw_employee_directory')
      .select('hire_date, termination_date')
      .eq('id', id)
      .maybeSingle(),
  ])
  if (employee.error) throw employee.error
  if (directory.error) throw directory.error
  if (!employee.data) return null
  return {
    ...employee.data,
    hire_date: directory.data?.hire_date ?? null,
    termination_date: directory.data?.termination_date ?? null,
  }
}

export async function getCurrentJobProfileName(id: string) {
  const { data, error } = await supabase
    .from('vw_employee_directory')
    .select('job_profile_name')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data?.job_profile_name ?? null
}

// Persona y fechas se guardan juntas, en una transacción del backend.
function employeeArgs(values: EmployeeFormValues) {
  return {
    p_employee_number: values.employee_number as string,
    p_first_name: values.first_name,
    p_last_name: values.last_name as string,
    p_second_last_name: values.second_last_name as string,
    p_employment_status: values.employment_status,
    p_hire_date: values.hire_date as string,
    p_termination_date: values.termination_date as string,
    p_notes: values.notes as string,
  }
}

export async function createEmployee(values: EmployeeFormValues) {
  const { data, error } = await supabase.rpc('create_employee', employeeArgs(values))
  if (error?.code === UNIQUE_VIOLATION) throw new DuplicateEmployeeNumberError()
  if (error) throw error
  return { id: data }
}

export async function updateEmployee(id: string, version: number, values: EmployeeFormValues) {
  const { data, error } = await supabase.rpc('update_employee', {
    p_id: id,
    p_version: version,
    ...employeeArgs(values),
  })
  if (error?.code === UNIQUE_VIOLATION) throw new DuplicateEmployeeNumberError()
  if (error) throw error
  if (!data) throw new EmployeeConflictError()
  return { id: data }
}

// Nombres del catálogo external_systems que se muestran en la tarjeta del expediente.
export const PROFILE_CONTROL_SYSTEMS = { hr: 'Interno RRHH', payroll: 'Nómina' } as const

// Número activo más reciente por sistema; RLS limita employee_control_numbers a RRHH.
export async function getProfileControlNumbers(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_control_numbers')
    .select('control_number, assigned_on, created_at, external_systems!inner(name)')
    .eq('employee_id', employeeId)
    .eq('status', 'Activo')
    .in('external_systems.name', Object.values(PROFILE_CONTROL_SYSTEMS))
    .order('assigned_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  const numbers: Record<string, string> = {}
  for (const row of data) {
    const system = row.external_systems.name
    numbers[system] ??= row.control_number
  }
  return {
    hr: numbers[PROFILE_CONTROL_SYSTEMS.hr] ?? null,
    payroll: numbers[PROFILE_CONTROL_SYSTEMS.payroll] ?? null,
  }
}

export async function getSensitiveData(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_sensitive_data')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listEmployeeTrainingStatus(employeeId: string) {
  const { data, error } = await supabase
    .from('vw_employee_training_status')
    .select('course_id, course_name, completed_on, expires_on, training_status')
    .eq('employee_id', employeeId)
    .order('course_name')
  if (error) throw error
  return data
}

export async function listEmployeeDocuments(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

interface StoredFile {
  id: string
  bucket: string | null
  storage_path: string | null
  sharepoint_item_id: string | null
}

// Con `downloadAs`, el navegador descarga el archivo con ese nombre en lugar de mostrarlo.
// SharePoint entrega una URL temporal que conserva el nombre original del archivo.
export async function createDocumentUrl(file: StoredFile, downloadAs?: string) {
  if (file.sharepoint_item_id) return getSharePointFileUrl(file.id)
  const { data, error } = await supabase.storage
    .from(file.bucket as string)
    .createSignedUrl(
      file.storage_path as string,
      SIGNED_URL_SECONDS,
      downloadAs ? { download: downloadAs } : undefined,
    )
  if (error) throw error
  return data.signedUrl
}

export function fileProblem(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Solo se aceptan archivos PDF, JPG o PNG.'
  if (file.size === 0) return 'El archivo está vacío.'
  if (file.size > MAX_FILE_BYTES) return 'El archivo no debe pasar de 10 MB.'
  return null
}

export function photoProblem(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Solo se aceptan imágenes JPG o PNG.'
  return fileProblem(file)
}

// La foto es un archivo más del expediente; vale la imagen más reciente de ese tipo.
export async function getEmployeePhoto(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_documents')
    .select('id, bucket, storage_path, sharepoint_item_id, mime_type')
    .eq('employee_id', employeeId)
    .eq('document_type', PHOTO_DOCUMENT_TYPE)
    .in('mime_type', PHOTO_TYPES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, url: await createDocumentUrl(data) }
}

export function uploadEmployeePhoto(employeeId: string, file: File) {
  return uploadEmployeeDocument(employeeId, PHOTO_DOCUMENT_TYPE, file)
}

export async function uploadEmployeeDocument(employeeId: string, documentType: string, file: File) {
  if (filesInSharePoint) return uploadToSharePoint(employeeId, documentType, file)

  const documentId = crypto.randomUUID()
  const safeName = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
  const path = `${employeeId}/${documentId}/${safeName}`

  const upload = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type,
  })
  if (upload.error) throw upload.error

  const { error } = await supabase.from('employee_documents').insert({
    id: documentId,
    employee_id: employeeId,
    document_type: documentType,
    bucket: DOCUMENTS_BUCKET,
    storage_path: path,
    original_filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  })
  if (error) {
    // Sin registro, el archivo quedaría huérfano.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    throw error
  }
}
