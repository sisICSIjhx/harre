import type { RecordField } from '@/shared/lib/record-fields'

export const jobProfileFields: RecordField[] = [
  { key: 'name', label: 'Puesto', required: true },
  { key: 'area', label: 'Área' },
  { key: 'profile_version', label: 'Versión' },
  { key: 'is_active', label: 'Activo', type: 'boolean', initial: true },
  { key: 'description', label: 'Descripción de funciones', type: 'textarea', formOnly: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
export const projectFields: RecordField[] = [
  { key: 'name', label: 'Proyecto', required: true },
  { key: 'tender_number', label: 'Núm. de licitación' },
  { key: 'client', label: 'Cliente' },
  { key: 'location', label: 'Ubicación' },
  { key: 'start_date', label: 'Inicio', type: 'date' },
  { key: 'end_date', label: 'Fin', type: 'date' },
  {
    key: 'status',
    label: 'Estatus',
    type: 'select',
    required: true,
    options: ['En licitación', 'Adjudicado', 'En ejecución', 'Terminado', 'No adjudicado'],
    initial: 'En licitación',
  },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
export const systemFields: RecordField[] = [
  { key: 'name', label: 'Sistema', required: true },
  { key: 'purpose', label: 'Función' },
  { key: 'responsible_area', label: 'Área responsable' },
  { key: 'is_active', label: 'Activo', type: 'boolean', initial: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
export const documentTypeFields: RecordField[] = [
  { key: 'code', label: 'Clave', required: true },
  { key: 'name', label: 'Documento', required: true },
  { key: 'document_group', label: 'Grupo' },
  {
    key: 'applicability_rule',
    label: 'Regla',
    type: 'select',
    options: ['General', 'Académico', 'Opcional', 'Empleo previo', 'Según puesto', 'Por confirmar'],
  },
  { key: 'expected_validity', label: 'Validez esperada' },
  { key: 'instructions', label: 'Indicación', type: 'textarea', formOnly: true },
]
export const courseFields: RecordField[] = [
  { key: 'name', label: 'Curso o certificación', required: true },
  {
    key: 'category',
    label: 'Categoría',
    type: 'select',
    options: ['Curso', 'Certificación', 'Evaluación', 'Otro'],
  },
  {
    key: 'required_evidence',
    label: 'Evidencia requerida',
    type: 'select',
    options: ['DC-3', 'Certificación', 'Constancia', 'Otro'],
  },
  { key: 'validity_months', label: 'Vigencia (meses)', type: 'number' },
  { key: 'standard_or_body', label: 'Organismo o norma' },
  { key: 'is_active', label: 'Activo', type: 'boolean', initial: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]

// La clave son los tres primeros dígitos de la CLABE; puede faltar en instituciones nuevas.
export const bankFields: RecordField[] = [
  { key: 'name', label: 'Banco', required: true },
  { key: 'code', label: 'Clave (3 dígitos)' },
  { key: 'is_active', label: 'Activo', type: 'boolean', initial: true },
]

// Campos de cada catálogo; permiten darlo de alta desde cualquier formulario que lo consulte.
export const CATALOG_FIELDS: Record<string, readonly RecordField[]> = {
  job_profiles: jobProfileFields,
  projects: projectFields,
  external_systems: systemFields,
  document_types: documentTypeFields,
  courses: courseFields,
  banks: bankFields,
}
