import type { Row, SheetDefinition } from '../build-workbook.js'

export const ASSIGNMENTS_SHEET = '09_ASIGNACIONES'
export const JOB_PROFILES_SHEET = '08_PERFILES'
export const PROJECTS_SHEET = '25_PROYECTOS'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// El estado se recalcula al abrir el archivo; el valor guardado sirve para vistas previas.
export function assignmentRows(rows: Row[]): Row[] {
  const now = today()
  return rows.map((row) => {
    const start = row.start_date as string | null
    const end = row.end_date as string | null
    let state = 'Vigente'
    if (start && start > now) state = 'Próxima'
    else if (end && end < now) state = 'Histórico'
    return { ...row, project_label: row.project ?? 'Sin proyecto (puesto base)', state }
  })
}

export const positionsSheet: SheetDefinition = {
  name: 'V_PUESTOS',
  title: 'PUESTOS POR PERSONA Y PROYECTO | HISTORIAL',
  subtitle:
    'Una fila por asignación: una persona puede tener varios puestos, uno por proyecto. Las terminadas quedan como Histórico.',
  statusKey: 'state',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'PUESTO / PERFIL', key: 'job_profile', width: 32 },
    { header: 'PROYECTO', key: 'project_label', width: 36 },
    { header: 'FECHA INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'FECHA FIN', key: 'end_date', kind: 'date', width: 13 },
    { header: 'PRINCIPAL', key: 'is_primary', kind: 'boolean', width: 11 },
    {
      header: 'ESTADO',
      key: 'state',
      width: 13,
      // La fila 6 de la vista corresponde a la fila 2 del catálogo.
      formula: (row) => `'${ASSIGNMENTS_SHEET}'!$H$${row - 4}`,
    },
    { header: 'CENTRO DE TRABAJO', key: 'work_center', width: 22 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const projectsSheet: SheetDefinition = {
  name: 'V_PROYECTOS',
  title: 'PROYECTOS Y LICITACIONES',
  subtitle: 'Proyectos a los que se asigna personal. PERSONAS muestra las asignaciones vigentes.',
  statusKey: 'status',
  columns: [
    { header: 'PROYECTO', key: 'name', width: 38 },
    { header: 'NÚM. LICITACIÓN', key: 'tender_number', width: 20 },
    { header: 'CLIENTE', key: 'client', width: 26 },
    { header: 'UBICACIÓN', key: 'location', width: 22 },
    { header: 'FECHA INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'FECHA FIN', key: 'end_date', kind: 'date', width: 13 },
    { header: 'ESTATUS', key: 'status', width: 16 },
    { header: 'PERSONAS', key: 'people', kind: 'number', width: 11 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const jobProfilesViewSheet: SheetDefinition = {
  name: 'V_PERFILES',
  title: 'CATÁLOGO DE PERFILES DE PUESTO',
  subtitle:
    'Puestos disponibles para asignar personal. Los cursos que exige cada uno están en V_REQUISITOS.',
  columns: [
    { header: 'PUESTO', key: 'name', width: 34 },
    { header: 'ÁREA', key: 'area', width: 20 },
    { header: 'DESCRIPCIÓN', key: 'description', width: 50 },
    { header: 'VERSIÓN', key: 'profile_version', width: 12 },
    { header: 'ACTIVO', key: 'is_active', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const jobProfilesSheet: SheetDefinition = {
  name: JOB_PROFILES_SHEET,
  columns: [
    { header: 'Nombre_puesto', key: 'name', width: 34 },
    { header: 'Area', key: 'area', width: 20 },
    { header: 'Activo', key: 'is_active', kind: 'boolean', width: 8 },
  ],
}

export const assignmentsSheet: SheetDefinition = {
  name: ASSIGNMENTS_SHEET,
  columns: [
    { header: 'Numero_empleado', key: 'employee_number', width: 16 },
    { header: 'Puesto', key: 'job_profile', width: 32 },
    { header: 'Proyecto', key: 'project', width: 36 },
    { header: 'Fecha_inicio', key: 'start_date', kind: 'date', width: 13 },
    { header: 'Fecha_fin', key: 'end_date', kind: 'date', width: 13 },
    { header: 'Principal', key: 'is_primary', kind: 'boolean', width: 9 },
    { header: 'Centro_trabajo', key: 'work_center', width: 22 },
    {
      header: 'Estado_asignacion',
      key: 'state',
      width: 15,
      formula: (r) =>
        `IF(AND(D${r}<>"",D${r}>TODAY()),"Próxima",IF(AND(E${r}<>"",E${r}<TODAY()),"Histórico","Vigente"))`,
    },
  ],
}

export const projectsCatalogSheet: SheetDefinition = {
  name: PROJECTS_SHEET,
  columns: [
    { header: 'Nombre_proyecto', key: 'name', width: 38 },
    { header: 'Numero_licitacion', key: 'tender_number', width: 20 },
    { header: 'Cliente', key: 'client', width: 26 },
    { header: 'Estatus', key: 'status', width: 16 },
  ],
}
