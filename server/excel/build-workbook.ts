import ExcelJS from 'exceljs'
import { addressesSheet } from './sheets/addresses.sheet.js'
import { bankAccountsSheet } from './sheets/bank-accounts.sheet.js'
import { creditsSheet } from './sheets/credits.sheet.js'
import { contactsSheet, emailRows, emailsSheet, phonesSheet } from './sheets/contacts.sheet.js'
import {
  documentTypesSheet,
  documentTypesViewSheet,
  documentsSheet,
  followUpSheet,
} from './sheets/documents.sheet.js'
import { educationSheet } from './sheets/education.sheet.js'
import {
  directorySheet,
  peopleSheet,
  personalDataSheet,
  workSitesSheet,
} from './sheets/employees.sheet.js'
import {
  ADMINISTRATIVE_ACT_KIND,
  administrativeActsSheet,
  CONFIDENTIALITY_KINDS,
  confidentialitySheet,
  contractsSheet,
  employmentSheet,
  experienceSheet,
  LOAN_KIND,
  loansSheet,
  LOCKER_CUSTODY_KIND,
  lockerCustodySheet,
  REGULATION_KIND,
  regulationsSheet,
  VEHICLE_CUSTODY_KIND,
  vehicleCustodySheet,
} from './sheets/experience.sheet.js'
import { permitsSheet } from './sheets/permits.sheet.js'
import { writeHomeSheet } from './sheets/home.sheet.js'
import {
  assignmentRows,
  assignmentsSheet,
  jobProfilesSheet,
  jobProfilesViewSheet,
  positionsSheet,
  projectsCatalogSheet,
  projectsSheet,
} from './sheets/positions.sheet.js'
import { summaryView, type ViewIndex } from './sheets/summary.sheet.js'
import {
  controlNumbersSheet,
  employeeNumbersView,
  systemsSheet,
  systemsViewSheet,
} from './sheets/systems.sheet.js'
import { writeTendersSheet } from './sheets/tenders.sheet.js'
import {
  accreditationsCatalogSheet,
  accreditationsSheet,
  courseControlSheet,
  coursesSheet,
  coursesViewSheet,
  requirementsCatalogSheet,
  requirementsSheet,
} from './sheets/training.sheet.js'

export type Row = Record<string, unknown>

export interface WorkbookSnapshot {
  revision: number
  message_ids: number[]
  employees: Row[]
  phones: Row[]
  emails: Row[]
  contacts: Row[]
  work_sites: Row[]
  addresses: Row[]
  education: Row[]
  experience: Row[]
  employment: Row[]
  contracts: Row[]
  confidentiality: Row[]
  job_profiles: Row[]
  projects: Row[]
  assignments: Row[]
  courses: Row[]
  requirements: Row[]
  accreditations: Row[]
  course_controls: Row[]
  documents: Row[]
  document_types: Row[]
  systems: Row[]
  control_numbers: Row[]
  bank_accounts: Row[]
  credits: Row[]
  permits: Row[]
}

export interface SheetColumn {
  header: string
  key: string
  kind?: 'text' | 'date' | 'boolean' | 'number' | 'money'
  width?: number
  // Celda calculada al abrir el archivo, porque depende de la fecha o del catálogo oculto.
  formula?: (excelRow: number) => string
}

export interface SheetDefinition {
  name: string
  columns: SheetColumn[]
  title?: string
  subtitle?: string
  statusKey?: string
  // Columnas inmovilizadas a la izquierda; por omisión, solo el nombre.
  frozenColumns?: number
}

const FONT = 'Arial'
export const NAVY = 'FF1F3864'
const GRAY = 'FF595959'
const BAND = 'FFF3F6FA'
const VIEW_HEADER_ROW = 5
const DATE_FORMAT = 'dd/mm/yyyy'
const MONEY_FORMAT = '"$"#,##0.00'

const GOOD = [
  'CUMPLE',
  'Cubierto',
  'Vigente',
  'SIN PENDIENTES REVISADOS',
  'OPCIONAL OK',
  'En ejecución',
  'Adjudicado',
]
const BAD = ['VENCIDO', 'NO CUMPLE', 'INCOMPLETO', 'Atrasado', 'No adjudicado']
const WARN = [
  'PENDIENTE',
  'POR DEFINIR',
  'Por verificar',
  'SIN EXPEDIENTE',
  'Sin evidencia',
  'SIN REQUISITOS',
  'POR VERIFICAR',
  'En licitación',
  'Sin cuenta de nómina',
]

export function solid(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function cfFill(argb: string): Partial<ExcelJS.Style> {
  return { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb } } }
}

export function columnLetter(index: number): string {
  let value = index
  let letters = ''
  while (value > 0) {
    const rest = (value - 1) % 26
    letters = String.fromCharCode(65 + rest) + letters
    value = (value - rest - 1) / 26
  }
  return letters
}

export function styleHeader(row: ExcelJS.Row, argb = NAVY): void {
  row.eachCell((cell) => {
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = solid(argb)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  row.height = 30
}

export function writeTitle(
  ws: ExcelJS.Worksheet,
  lastColumn: string,
  title: string,
  subtitle?: string,
): void {
  ws.mergeCells(`A1:${lastColumn}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = title
  titleCell.font = { name: FONT, size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = solid(NAVY)
  titleCell.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(1).height = 28
  if (subtitle) {
    ws.mergeCells(`A3:${lastColumn}3`)
    const subtitleCell = ws.getCell('A3')
    subtitleCell.value = subtitle
    subtitleCell.font = { name: FONT, size: 9, italic: true, color: { argb: 'FF44546A' } }
    subtitleCell.alignment = { vertical: 'middle', wrapText: true }
    ws.getRow(3).height = 26
  }
}

function orEquals(cell: string, words: string[]): string {
  return `OR(${words.map((word) => `${cell}="${word}"`).join(',')})`
}

export function addStatusRules(
  ws: ExcelJS.Worksheet,
  column: string,
  first: number,
  last: number,
): void {
  const cell = `${column}${first}`
  ws.addConditionalFormatting({
    ref: `${column}${first}:${column}${last}`,
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: [orEquals(cell, GOOD)],
        style: { ...cfFill('FFC6EFCE'), font: { color: { argb: 'FF006100' }, bold: true } },
      },
      {
        type: 'expression',
        priority: 2,
        formulae: [orEquals(cell, BAD)],
        style: { ...cfFill('FFFFC7CE'), font: { color: { argb: 'FF9C0006' }, bold: true } },
      },
      {
        type: 'expression',
        priority: 3,
        formulae: [orEquals(cell, WARN)],
        style: { ...cfFill('FFFFEB9C'), font: { color: { argb: 'FF7F6000' }, bold: true } },
      },
    ],
  })
}

export function addBanding(ws: ExcelJS.Worksheet, ref: string): void {
  ws.addConditionalFormatting({
    ref,
    rules: [{ type: 'expression', priority: 9, formulae: ['MOD(ROW(),2)=0'], style: cfFill(BAND) }],
  })
}

export function toCellValue(column: SheetColumn, value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined || value === '') return null
  if (column.kind === 'date') {
    // Fechas civiles YYYY-MM-DD: se fijan en UTC para no desplazarlas por zona horaria.
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
    return new Date(Date.UTC(year as number, (month as number) - 1, day))
  }
  if (column.kind === 'boolean') return value ? 'Sí' : 'No'
  if (column.kind === 'number' || column.kind === 'money') return Number(value)
  return String(value)
}

function writeRows(
  ws: ExcelJS.Worksheet,
  definition: SheetDefinition,
  rows: Row[],
  headerRow: number,
): void {
  definition.columns.forEach((column, index) => {
    const sheetColumn = ws.getColumn(index + 1)
    sheetColumn.width = column.width ?? 20
    const header = ws.getCell(headerRow, index + 1)
    header.value = column.header
  })
  rows.forEach((row, rowIndex) => {
    const excelRow = headerRow + 1 + rowIndex
    definition.columns.forEach((column, index) => {
      const cell = ws.getCell(excelRow, index + 1)
      const value = toCellValue(column, row[column.key])
      cell.value = column.formula
        ? ({ formula: column.formula(excelRow), result: value ?? '' } as ExcelJS.CellFormulaValue)
        : value
      cell.font = { name: FONT, size: 10 }
      if (definition.name === 'V_CORREOS') {
        cell.alignment = { vertical: 'top', wrapText: true }
      }
      // '@' conserva ceros iniciales en identificadores, teléfonos y números de control.
      if (column.kind === 'date') cell.numFmt = DATE_FORMAT
      else if (column.kind === 'number') cell.alignment = { horizontal: 'center' }
      else if (column.kind === 'money') cell.numFmt = MONEY_FORMAT
      else if (!column.formula) cell.numFmt = '@'
    })
  })
}

function addView(wb: ExcelJS.Workbook, definition: SheetDefinition, rows: Row[]): void {
  const ws = wb.addWorksheet(definition.name)
  const lastColumn = columnLetter(definition.columns.length)
  writeTitle(ws, lastColumn, definition.title ?? definition.name, definition.subtitle)
  writeRows(ws, definition, rows, VIEW_HEADER_ROW)
  styleHeader(ws.getRow(VIEW_HEADER_ROW))
  ws.views = [
    {
      state: 'frozen',
      xSplit: definition.frozenColumns ?? 1,
      ySplit: VIEW_HEADER_ROW,
      showGridLines: false,
    },
  ]
  ws.properties.tabColor = { argb: 'FF2F5597' }
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  ws.autoFilter = {
    from: { row: VIEW_HEADER_ROW, column: 1 },
    to: { row: VIEW_HEADER_ROW, column: definition.columns.length },
  }
  const last = VIEW_HEADER_ROW + Math.max(rows.length, 1)
  if (definition.statusKey) {
    const index = definition.columns.findIndex((column) => column.key === definition.statusKey)
    addStatusRules(ws, columnLetter(index + 1), VIEW_HEADER_ROW + 1, last)
  }
  addBanding(ws, `A${VIEW_HEADER_ROW + 1}:${lastColumn}${last}`)
}

function addCatalog(wb: ExcelJS.Workbook, definition: SheetDefinition, rows: Row[]): void {
  const ws = wb.addWorksheet(definition.name)
  writeRows(ws, definition, rows, 1)
  styleHeader(ws.getRow(1), GRAY)
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.state = 'hidden'
}

function layout(snapshot: WorkbookSnapshot, generatedAt = new Date()) {
  const assignments = assignmentRows(snapshot.assignments)
  const accreditations = snapshot.accreditations
  const followUp = snapshot.employees.map((row) => ({
    ...row,
    // Un expediente histórico puede estar incompleto: no se marca como pendiente.
    situation:
      row.status === 'Inactivo'
        ? 'BAJA'
        : Number(row.docs_undefined) > 0
          ? 'POR DEFINIR'
          : Number(row.docs_pending) > 0
            ? 'INCOMPLETO'
            : 'SIN PENDIENTES REVISADOS',
  }))
  // Los demás documentos firmados llegan en el bloque de confidencialidad; cada tipo se publica
  // en su propia vista.
  const signed = (...kinds: string[]) =>
    snapshot.confidentiality.filter((row) => kinds.includes(String(row.document_kind)))
  const views: [SheetDefinition, Row[]][] = [
    [positionsSheet, assignments],
    [projectsSheet, snapshot.projects],
    [directorySheet, snapshot.employees],
    employeeNumbersView(snapshot.employees, snapshot.control_numbers, snapshot.systems),
    [personalDataSheet, snapshot.employees],
    [workSitesSheet, snapshot.work_sites],
    [emailsSheet, emailRows(snapshot.employees, snapshot.emails)],
    [phonesSheet, snapshot.phones],
    [contactsSheet, snapshot.contacts],
    [addressesSheet, snapshot.addresses],
    [educationSheet, snapshot.education],
    [experienceSheet, snapshot.experience],
    [employmentSheet, snapshot.employment],
    [contractsSheet, snapshot.contracts],
    [confidentialitySheet, signed(...CONFIDENTIALITY_KINDS)],
    [lockerCustodySheet, signed(LOCKER_CUSTODY_KIND)],
    [vehicleCustodySheet, signed(VEHICLE_CUSTODY_KIND)],
    [regulationsSheet, signed(REGULATION_KIND)],
    [administrativeActsSheet, signed(ADMINISTRATIVE_ACT_KIND)],
    [loansSheet, signed(LOAN_KIND)],
    [permitsSheet, snapshot.permits],
    [courseControlSheet, snapshot.course_controls],
    [accreditationsSheet, accreditations],
    [requirementsSheet, snapshot.requirements],
    [documentsSheet, snapshot.documents],
    [controlNumbersSheet, snapshot.control_numbers],
    [bankAccountsSheet, snapshot.bank_accounts],
    [creditsSheet, snapshot.credits],
    [followUpSheet, followUp],
    [coursesViewSheet, snapshot.courses],
    [jobProfilesViewSheet, snapshot.job_profiles],
    [documentTypesViewSheet, snapshot.document_types],
    [systemsViewSheet, snapshot.systems],
  ]
  const index: ViewIndex = new Map(
    views.map(([definition, rows]) => [definition.name, { definition, rows }]),
  )
  return {
    summary: summaryView(index, snapshot.employees, generatedAt),
    views,
    catalogs: [
      [peopleSheet, snapshot.employees],
      [jobProfilesSheet, snapshot.job_profiles],
      [assignmentsSheet, assignments],
      [coursesSheet, snapshot.courses],
      [requirementsCatalogSheet, snapshot.requirements],
      [accreditationsCatalogSheet, accreditations],
      [documentTypesSheet, snapshot.document_types],
      [systemsSheet, snapshot.systems],
      [projectsCatalogSheet, snapshot.projects],
    ],
  } as {
    summary: [SheetDefinition, Row[]]
    views: [SheetDefinition, Row[]][]
    catalogs: [SheetDefinition, Row[]][]
  }
}

export async function buildWorkbook(
  snapshot: WorkbookSnapshot,
  generatedAt = new Date(),
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ICSI RRHH'
  workbook.created = generatedAt
  workbook.calcProperties = { fullCalcOnLoad: true }

  const { summary, views, catalogs } = layout(snapshot, generatedAt)
  // Orden de pestañas: portada, concentrado, licitaciones y el resto de las vistas.
  writeHomeSheet(workbook, snapshot, generatedAt)
  addView(workbook, ...summary)
  writeTendersSheet(workbook, snapshot)
  for (const [definition, rows] of views) addView(workbook, definition, rows)
  for (const [definition, rows] of catalogs) addCatalog(workbook, definition, rows)
  workbook.views = [{ activeTab: 0, firstSheet: 0 }] as never

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

// Reabre el XLSX antes de publicarlo. Lanza un error si no coincide con la instantánea.
export async function validateWorkbook(buffer: Buffer, snapshot: WorkbookSnapshot): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  const { summary, views, catalogs } = layout(snapshot)

  const check = (
    [definition, rows]: [SheetDefinition, Row[]],
    headerRow: number,
    hidden: boolean,
  ) => {
    const sheet = workbook.getWorksheet(definition.name)
    if (!sheet) throw new Error(`Falta la hoja ${definition.name}`)
    if ((sheet.state === 'hidden') !== hidden) {
      throw new Error(`Visibilidad incorrecta en la hoja ${definition.name}`)
    }
    definition.columns.forEach((column, index) => {
      const text = sheet.getRow(headerRow).getCell(index + 1).text
      if (text !== column.header)
        throw new Error(`Columnas inesperadas en la hoja ${definition.name}`)
    })
    const count = sheet.actualRowCount - (headerRow === 1 ? 1 : 3)
    if (count !== rows.length) {
      throw new Error(`Conteo incorrecto en ${definition.name}: ${count} de ${rows.length}`)
    }
  }
  check(summary, VIEW_HEADER_ROW, false)
  views.forEach((view) => check(view, VIEW_HEADER_ROW, false))
  catalogs.forEach((catalog) => check(catalog, 1, true))

  // Las fórmulas del concentrado buscan por número: debe coincidir con la instantánea.
  const people = workbook.getWorksheet(peopleSheet.name)
  const concentrated = workbook.getWorksheet(summary[0].name)
  snapshot.employees.forEach((row, index) => {
    if (people?.getRow(index + 2).getCell(1).value !== row.employee_number) {
      throw new Error(`Número de empleado alterado en la fila ${index + 2}`)
    }
    if (
      concentrated?.getRow(VIEW_HEADER_ROW + 1 + index).getCell(2).value !== row.employee_number
    ) {
      throw new Error(`Número de empleado alterado en ${summary[0].name}`)
    }
  })

  for (const name of ['V_INICIO', 'V_LICITACIONES']) {
    if (!workbook.getWorksheet(name)) throw new Error(`Falta la hoja ${name}`)
  }
}
