import type ExcelJS from 'exceljs'
import { NAVY, solid, styleHeader, writeTitle, type WorkbookSnapshot } from '../build-workbook.js'

const FONT = 'Arial'
const BAND = 'FFF3F6FA'

const VIEWS = [
  ['V_CONCENTRADO', 'Una fila por persona con lo esencial de todas las vistas'],
  ['V_LICITACIONES', 'Elegir un puesto y ver quién cumple los cursos requeridos, y qué le falta'],
  ['V_PUESTOS', 'Puestos de cada persona por proyecto, con historial'],
  ['V_PROYECTOS', 'Proyectos y licitaciones, con personal asignado'],
  ['V_REQUISITOS', 'Cursos que exige cada puesto'],
  ['V_ACREDITACIONES', 'Cursos, DC-3 y certificaciones de cada persona, con vigencia'],
  ['V_CAPACITACION', 'Cursos exigidos a cada persona y su cumplimiento'],
  ['V_DIRECTORIO', 'Sede, puesto actual, teléfono, correos, checador y observaciones'],
  ['V_NUM_EMPLEADO', 'Números de empleado de cada persona: Interno RR. HH., Nómina y Checador'],
  ['V_DATOS_PERSONALES', 'Nacimiento, CURP, RFC, NSS, tipo de sangre y alergias'],
  ['V_SEDES', 'Historial de sedes de cada persona'],
  ['V_CORREOS', 'Una fila por persona; correos personales, corporativos y de licitaciones'],
  ['V_TELEFONOS', 'Todos los teléfonos registrados'],
  ['V_CONTACTOS', 'Contactos de emergencia y beneficiarios'],
  ['V_DOMICILIOS', 'Domicilios: INE, fiscal, actual y otros'],
  ['V_FORMACION', 'Estudios, cédula y grado acreditado'],
  ['V_EXPERIENCIA', 'Experiencia laboral por empresa y proyecto'],
  ['V_ALTAS_BAJAS', 'Ingresos, altas de IMSS, bajas y reingresos'],
  ['V_CONTRATOS', 'Contratos y renovaciones con sus fechas'],
  ['V_CONFIDENCIALIDAD', 'Cartas y acuerdos de confidencialidad con su fecha de firma'],
  ['V_RESGUARDO_CASILLERO', 'Resguardos de casillero con su fecha de firma'],
  ['V_RESGUARDO_VEHICULO', 'Resguardos de vehículo con su fecha de firma'],
  ['V_REGLAMENTO', 'Reglamentos firmados con su fecha de firma'],
  ['V_ACTAS_ADMINISTRATIVAS', 'Actas administrativas con su fecha'],
  ['V_PRESTAMOS', 'Préstamos al personal con su fecha y cantidad'],
  ['V_PERMISOS', 'Permisos por días u horas, con su periodo y motivo'],
  ['V_DOCUMENTOS', 'Documentos del expediente de cada persona'],
  ['V_SEGUIMIENTO', 'Pendientes de documentos y cursos por persona'],
  ['V_NUMEROS', 'Historial de números de empleado por sistema, con altas y bajas'],
  ['V_DATOS_BANCARIOS', 'Cuentas de nómina y alternativas; personas activas sin cuenta de nómina'],
  ['V_CREDITOS', 'Créditos INFONAVIT y FONACOT con su número'],
  ['V_CURSOS', 'Catálogo de cursos y certificaciones'],
  ['V_PERFILES', 'Catálogo de perfiles de puesto'],
  ['V_CAT_DOCUMENTOS', 'Catálogo de documentos del expediente'],
  ['V_SISTEMAS', 'Catálogo de sistemas internos'],
] as const

export function writeHomeSheet(
  wb: ExcelJS.Workbook,
  snapshot: WorkbookSnapshot,
  generatedAt: Date,
): void {
  const ws = wb.addWorksheet('V_INICIO')
  ws.properties.tabColor = { argb: NAVY }
  ws.views = [{ showGridLines: false }]
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  ws.getColumn(1).width = 26
  ws.getColumn(2).width = 66
  ws.getColumn(3).width = 4
  ws.getColumn(4).width = 32
  ws.getColumn(5).width = 24

  writeTitle(ws, 'E', 'PERSONAL ICSI | CONSULTAS PARA RR. HH.')
  ws.mergeCells('A2:E2')
  const note = ws.getCell('A2')
  note.value =
    'Archivo generado por el sistema, solo de consulta: las ediciones manuales se pierden en la siguiente publicación. Los catálogos están ocultos.'
  note.font = { name: FONT, size: 9, italic: true, color: { argb: 'FF44546A' } }
  note.alignment = { wrapText: true, vertical: 'middle' }
  ws.getRow(2).height = 30

  ws.getCell('A4').value = 'VISTA'
  ws.getCell('B4').value = 'PARA QUÉ SIRVE'
  ws.getCell('D4').value = 'RESUMEN'
  ws.getCell('E4').value = 'TOTAL'
  styleHeader(ws.getRow(4))
  ws.getRow(4).height = 20

  VIEWS.forEach(([view, description], index) => {
    const row = 5 + index
    const link = ws.getCell(row, 1)
    link.value = {
      formula: `HYPERLINK("#'${view}'!A1","${view}")`,
      result: view,
    } as ExcelJS.CellFormulaValue
    link.font = { name: FONT, size: 10, underline: true, color: { argb: 'FF0563C1' } }
    const text = ws.getCell(row, 2)
    text.value = description
    text.font = { name: FONT, size: 10 }
    if (index % 2) {
      link.fill = solid(BAND)
      text.fill = solid(BAND)
    }
  })

  const accreditedAs = (validity: string) =>
    snapshot.accreditations.filter((row) => row.validity === validity).length
  const totals: [string, number | string][] = [
    ['Personas registradas', snapshot.employees.length],
    ['Personas activas', snapshot.employees.filter((row) => row.status === 'Activo').length],
    [
      'Personas dadas de baja',
      snapshot.employees.filter((row) => row.status === 'Inactivo').length,
    ],
    ['Puestos en catálogo', snapshot.job_profiles.length],
    ['Cursos en catálogo', snapshot.courses.length],
    ['Proyectos', snapshot.projects.length],
    ['Cursos vigentes acreditados', accreditedAs('Vigente')],
    ['Cursos vencidos', accreditedAs('Vencido')],
    ['Revisión de datos', snapshot.revision],
    ['Generado (UTC)', generatedAt.toISOString().slice(0, 16).replace('T', ' ')],
  ]
  totals.forEach(([label, value], index) => {
    const row = 5 + index
    const name = ws.getCell(row, 4)
    name.value = label
    name.font = { name: FONT, size: 10 }
    const total = ws.getCell(row, 5)
    total.value = value
    total.font = { name: FONT, size: 10, bold: true }
    total.alignment = { horizontal: 'center' }
    if (index % 2) {
      name.fill = solid(BAND)
      total.fill = solid(BAND)
    }
  })
}
