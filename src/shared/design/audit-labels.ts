import { formatDateValue } from '../utils/format'

const labels: Record<string, string> = {
  first_name: 'Nombres',
  last_name: 'Apellido paterno',
  second_last_name: 'Apellido materno',
  employee_number: 'Número de empleado',
  employment_status: 'Estado laboral',
  hire_date: 'Fecha de alta',
  termination_date: 'Fecha de baja',
  notes: 'Observaciones',
  name: 'Nombre',
  description: 'Descripción',
  phone: 'Teléfono',
  email: 'Correo',
  phone_type: 'Tipo de teléfono',
  email_type: 'Tipo de correo',
  address: 'Domicilio',
  address_type: 'Tipo de domicilio',
  street: 'Calle',
  city: 'Ciudad',
  state: 'Estado',
  postal_code: 'Código postal',
  country: 'País',
  institution: 'Institución',
  degree: 'Grado',
  company: 'Empresa',
  position: 'Puesto',
  start_date: 'Inicio',
  end_date: 'Fin',
  birth_date: 'Fecha de nacimiento',
  curp: 'CURP',
  rfc: 'RFC',
  nss: 'NSS',
  blood_type: 'Tipo de sangre',
  allergies: 'Alergias',
  has_medical_certificate: 'Certificado médico',
  medical_certificate_date: 'Fecha del certificado médico',
  course_id: 'Curso relacionado',
  job_profile_id: 'Puesto relacionado',
  project_id: 'Proyecto relacionado',
  document_type_id: 'Tipo de documento',
  document_url: 'Enlace del documento',
  file_name: 'Nombre de archivo',
  issued_on: 'Emisión',
  expires_on: 'Vencimiento',
  received_on: 'Recepción',
  completed_on: 'Fecha de realización',
  review_status: 'Revisión',
  manual_decision: 'Aplicación del documento',
  validated_by: 'Validado por',
  is_primary: 'Principal',
  is_mandatory: 'Obligatorio',
  periodicity_months: 'Periodicidad en meses',
  updated_at: 'Última actualización',
  created_at: 'Fecha de registro',
  version: 'Versión',
  employee_id: 'Empleado relacionado',
  id: 'Referencia interna',
  user_id: 'Usuario relacionado',
  account_type: 'Tipo de cuenta',
  bank_id: 'Banco relacionado',
  clabe: 'CLABE',
  account_number: 'Número de cuenta',
  holder_name: 'Titular',
  code: 'Clave',
  is_active: 'Activo',
  document_kind: 'Tipo de documento firmado',
  signed_on: 'Fecha de firma',
  amount: 'Cantidad',
  permit_type: 'Tipo de permiso',
  start_time: 'Hora de inicio',
  end_time: 'Hora de término',
  reason: 'Motivo',
}
export function auditFieldLabel(field: string): string {
  return labels[field] ?? 'Otro campo del registro'
}
export function auditValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const date = formatDateValue(field, value)
  if (date !== null) return date
  // El historial conserva la referencia exacta, identificada como técnica y no como número de empleado.
  if (field === 'id' || field.endsWith('_id')) return `Referencia interna: ${String(value)}`
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const statuses: Record<string, string> = {
    active: 'Activo',
    onboarding: 'En integración',
    terminated: 'Baja',
  }
  if (field === 'employment_status') return statuses[String(value)] ?? String(value)
  return String(value)
}
