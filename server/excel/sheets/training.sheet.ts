import type { SheetDefinition } from '../build-workbook.js'

export const ACCREDITATIONS_SHEET = '12_ACREDITACIONES'
export const REQUIREMENTS_SHEET = '11_PERFIL_CURSOS'

export const courseControlSheet: SheetDefinition = {
  name: 'V_CAPACITACION',
  title: 'CAPACITACIÓN Y CURSOS EXIGIDOS',
  subtitle: 'Una fila por curso exigido a la persona, según sus puestos vigentes.',
  statusKey: 'compliance',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'CURSO / CERTIFICACIÓN', key: 'course', width: 38 },
    { header: 'OBLIGATORIO', key: 'is_mandatory', kind: 'boolean', width: 13 },
    { header: 'FECHA LÍMITE', key: 'deadline', kind: 'date', width: 13 },
    { header: 'CUMPLIMIENTO', key: 'compliance', width: 15 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

// Mismo orden que el catálogo oculto: la vigencia se lee de ahí y cambia con la fecha.
export const accreditationsSheet: SheetDefinition = {
  name: 'V_ACREDITACIONES',
  title: 'CURSOS ACREDITADOS Y CERTIFICADOS',
  subtitle: 'Historial de constancias, DC-3 y certificaciones. Cada renovación ocupa una fila.',
  statusKey: 'validity',
  columns: [
    { header: 'PERSONAL', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'CURSO', key: 'course', width: 38 },
    { header: 'FECHA ACREDITACIÓN', key: 'completed_on', kind: 'date', width: 14 },
    { header: 'VENCIMIENTO', key: 'expires_on', kind: 'date', width: 13 },
    { header: 'EVIDENCIA', key: 'evidence_type', width: 14 },
    { header: 'FOLIO', key: 'certificate_folio', width: 16 },
    {
      header: 'VIGENCIA',
      key: 'validity',
      width: 13,
      // La fila 6 de la vista corresponde a la fila 2 del catálogo.
      formula: (row) => `'${ACCREDITATIONS_SHEET}'!$I$${row - 4}`,
    },
    { header: 'EMISOR', key: 'issuer', width: 24 },
    { header: 'HORAS', key: 'duration_hours', kind: 'number', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const requirementsSheet: SheetDefinition = {
  name: 'V_REQUISITOS',
  title: 'CURSOS REQUERIDOS POR PERFIL DE PUESTO',
  subtitle:
    'Cada fila es un curso obligatorio u opcional. Sin proyecto, aplica al puesto en general; con proyecto, a esa licitación.',
  columns: [
    { header: 'PROYECTO', key: 'project', width: 30 },
    { header: 'PERFIL DE PUESTO', key: 'job_profile', width: 34 },
    { header: 'CURSO / CERTIFICACIÓN', key: 'course', width: 38 },
    { header: 'EVIDENCIA EXIGIDA', key: 'required_evidence', width: 16 },
    { header: 'OBLIGATORIO', key: 'is_mandatory', kind: 'boolean', width: 13 },
    { header: 'PERIODICIDAD (MESES)', key: 'periodicity_months', kind: 'number', width: 14 },
    { header: 'ORIGEN', key: 'source', width: 14 },
    { header: 'OBSERVACIONES', key: 'notes', width: 34 },
  ],
}

export const coursesViewSheet: SheetDefinition = {
  name: 'V_CURSOS',
  title: 'CATÁLOGO DE CURSOS Y CERTIFICACIONES',
  subtitle: 'VIGENCIA en meses; 0 indica que el curso no vence.',
  columns: [
    { header: 'CURSO / CERTIFICACIÓN', key: 'name', width: 38 },
    { header: 'CATEGORÍA', key: 'category', width: 16 },
    { header: 'DESCRIPCIÓN', key: 'description', width: 44 },
    { header: 'EVIDENCIA EXIGIDA', key: 'required_evidence', width: 16 },
    { header: 'NORMA / ORGANISMO', key: 'standard_or_body', width: 24 },
    { header: 'VIGENCIA (MESES)', key: 'validity_months', kind: 'number', width: 12 },
    { header: 'ACTIVO', key: 'is_active', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const coursesSheet: SheetDefinition = {
  name: '10_CURSOS',
  columns: [
    { header: 'Nombre_curso', key: 'name', width: 38 },
    { header: 'Categoria', key: 'category', width: 14 },
    { header: 'Evidencia_requerida', key: 'required_evidence', width: 16 },
    { header: 'Vigencia_meses', key: 'validity_months', kind: 'number', width: 12 },
    { header: 'Activo', key: 'is_active', kind: 'boolean', width: 8 },
  ],
}

export const requirementsCatalogSheet: SheetDefinition = {
  name: REQUIREMENTS_SHEET,
  columns: [
    { header: 'Puesto', key: 'job_profile', width: 34 },
    { header: 'Curso', key: 'course', width: 38 },
    { header: 'Obligatorio', key: 'is_mandatory', kind: 'boolean', width: 11 },
    { header: 'Periodicidad_meses', key: 'periodicity_months', kind: 'number', width: 12 },
    { header: 'Proyecto', key: 'project', width: 30 },
  ],
}

export const accreditationsCatalogSheet: SheetDefinition = {
  name: ACCREDITATIONS_SHEET,
  columns: [
    { header: 'Numero_empleado', key: 'employee_number', width: 16 },
    { header: 'Curso', key: 'course', width: 38 },
    { header: 'Fecha_acreditacion', key: 'completed_on', kind: 'date', width: 13 },
    { header: 'Fecha_vencimiento', key: 'expires_on', kind: 'date', width: 13 },
    { header: 'Tipo_evidencia', key: 'evidence_type', width: 14 },
    { header: 'Folio', key: 'certificate_folio', width: 16 },
    { header: 'Vigencia_meses', key: 'validity_months', kind: 'number', width: 10 },
    { header: 'Emisor', key: 'issuer', width: 24 },
    {
      header: 'Estado_vigencia',
      key: 'validity',
      width: 14,
      formula: (r) =>
        `IF(C${r}="","Sin evidencia",IF(D${r}<>"",IF(D${r}<TODAY(),"Vencido","Vigente"),IF(N(G${r})=0,"Vigente","Por verificar")))`,
    },
  ],
}
