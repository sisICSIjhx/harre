import type ExcelJS from 'exceljs'
import {
  addBanding,
  addStatusRules,
  solid,
  styleHeader,
  writeTitle,
  type WorkbookSnapshot,
} from '../build-workbook.js'
import { ASSIGNMENTS_SHEET, JOB_PROFILES_SHEET, PROJECTS_SHEET } from './positions.sheet.js'
import { ACCREDITATIONS_SHEET, REQUIREMENTS_SHEET } from './training.sheet.js'

const FONT = 'Arial'
const HEADER_ROW = 6
const INPUT = 'FFFFF2CC'

// Rango absoluto de una columna de catálogo; siempre incluye al menos una fila.
function range(sheet: string, column: string, rows: number): string {
  return `'${sheet}'!$${column}$2:$${column}$${Math.max(rows, 1) + 1}`
}

export function writeTendersSheet(wb: ExcelJS.Workbook, snapshot: WorkbookSnapshot): void {
  const ws = wb.addWorksheet('V_LICITACIONES')
  ws.properties.tabColor = { argb: 'FFC55A11' }
  writeTitle(ws, 'J', 'LICITACIONES | ¿QUIÉN CUMPLE PARA ESTE PUESTO?')

  const req = (column: string) => range(REQUIREMENTS_SHEET, column, snapshot.requirements.length)
  const acc = (column: string) =>
    range(ACCREDITATIONS_SHEET, column, snapshot.accreditations.length)
  const asg = (column: string) => range(ASSIGNMENTS_SHEET, column, snapshot.assignments.length)

  const label = (address: string, text: string) => {
    const cell = ws.getCell(address)
    cell.value = text
    cell.font = { name: FONT, size: 10, bold: true }
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
  }
  label('A3', 'Puesto a cubrir:')
  label('A4', 'Proyecto (opcional):')
  ws.mergeCells('B3:C3')
  ws.mergeCells('B4:C4')
  for (const address of ['B3', 'B4']) {
    const cell = ws.getCell(address)
    cell.fill = solid(INPUT)
    cell.font = { name: FONT, size: 10, bold: true }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  }
  // Los tipos de ExcelJS no declaran dataValidations en la hoja.
  const validations = (
    ws as unknown as {
      dataValidations: { add(range: string, rule: ExcelJS.DataValidation): void }
    }
  ).dataValidations
  validations.add('B3:C3', {
    type: 'list',
    allowBlank: true,
    formulae: [range(JOB_PROFILES_SHEET, 'A', snapshot.job_profiles.length)],
    showInputMessage: true,
    promptTitle: 'Puesto',
    prompt: 'Elige el puesto que pide la licitación.',
  })
  validations.add('B4:C4', {
    type: 'list',
    allowBlank: true,
    formulae: [range(PROJECTS_SHEET, 'A', snapshot.projects.length)],
    showInputMessage: true,
    promptTitle: 'Proyecto',
    prompt: 'Aplica los requisitos de esa licitación y muestra quién ya está asignado.',
  })

  const firstRow = HEADER_ROW + 1
  // Quien ya causó baja no es candidato para una licitación.
  const candidates = snapshot.employees.filter((employee) => employee.status !== 'Inactivo')
  const lastRow = HEADER_ROW + Math.max(candidates.length, 1)
  ws.mergeCells('D3:E3')
  ws.mergeCells('D4:E4')
  ws.getCell('D3').value = 'Cursos obligatorios del puesto:'
  ws.getCell('D4').value = 'Personas que cumplen:'
  // Requisitos del puesto en general, más los de la licitación elegida.
  const applies = `(${req('A')}=$B$3)*(${req('C')}<>"No")*(((${req('E')}=$B$4)+(${req('E')}=""))>0)`
  ws.getCell('F3').value = {
    formula: `IF($B$3="","",SUMPRODUCT(${applies}))`,
    result: '',
  } as ExcelJS.CellFormulaValue
  ws.getCell('F4').value = {
    formula: `IF($B$3="","",COUNTIF($I$${firstRow}:$I$${lastRow},"CUMPLE"))`,
    result: '',
  } as ExcelJS.CellFormulaValue
  for (const address of ['D3', 'D4']) {
    ws.getCell(address).font = { name: FONT, size: 10 }
    ws.getCell(address).alignment = { horizontal: 'right' }
  }
  for (const address of ['F3', 'F4']) {
    ws.getCell(address).font = { name: FONT, size: 11, bold: true }
    ws.getCell(address).alignment = { horizontal: 'center' }
  }

  const heads = [
    ['PERSONAL', 36],
    ['SEDE', 16],
    ['ESTATUS', 13],
    ['PUESTO ACTUAL', 28],
    ['PUESTO EN ESTE PROYECTO', 28],
    ['OBLIGATORIOS', 15],
    ['CUBIERTOS', 13],
    ['FALTAN', 9],
    ['RESULTADO', 16],
    ['CURSOS FALTANTES, VENCIDOS O POR VERIFICAR', 60],
  ] as const
  heads.forEach(([header, width], index) => {
    ws.getCell(HEADER_ROW, index + 1).value = header
    ws.getColumn(index + 1).width = width
  })
  styleHeader(ws.getRow(HEADER_ROW))
  // Columnas ocultas: número de empleado, que enlaza con los catálogos, y cursos sin fecha confirmada.
  ws.getColumn(12).hidden = true
  ws.getColumn(13).hidden = true

  candidates.forEach((employee, index) => {
    const r = firstRow + index
    const write = (column: number, value: ExcelJS.CellValue, center = false) => {
      const cell = ws.getCell(r, column)
      cell.value = value
      cell.font = { name: FONT, size: 10 }
      if (center) cell.alignment = { horizontal: 'center' }
    }
    const formula = (column: number, text: string, center = true) =>
      write(column, { formula: text, result: '' } as ExcelJS.CellFormulaValue, center)
    const covered = `COUNTIFS(${acc('A')},$L${r},${acc('B')},${req('B')},${acc('I')},"Vigente")`

    write(1, String(employee.full_name))
    write(2, (employee.site as string | null) ?? null)
    write(3, String(employee.status))
    write(4, (employee.job_profile as string | null) ?? null)
    ws.getCell(r, 12).value = String(employee.employee_number)
    ws.getCell(r, 12).numFmt = '@'
    formula(
      5,
      `IF($B$4="","",IFERROR(LOOKUP(2,1/((${asg('A')}=$L${r})*(${asg('C')}=$B$4)*(${asg('H')}<>"Histórico")),${asg('B')}),""))`,
      false,
    )
    formula(6, 'IF($B$3="","",$F$3)')
    formula(7, `IF($B$3="","",SUMPRODUCT(${applies}*(${covered}>0)))`)
    formula(8, `IF(OR(F${r}="",G${r}=""),"",F${r}-G${r})`)
    // Tiene el curso, pero sin la fecha que permite confirmar su vigencia.
    const unverified = `COUNTIFS(${acc('A')},$L${r},${acc('B')},${req('B')},${acc('I')},"Sin evidencia")+COUNTIFS(${acc('A')},$L${r},${acc('B')},${req('B')},${acc('I')},"Por verificar")`
    ws.getCell(r, 13).value = {
      formula: `IF($B$3="","",SUMPRODUCT(${applies}*(${covered}=0)*((${unverified})>0)))`,
      result: '',
    } as ExcelJS.CellFormulaValue
    formula(
      9,
      `IF(F${r}="","",IF(F${r}=0,"SIN REQUISITOS",IF(H${r}=0,"CUMPLE",IF($M${r}=H${r},"POR VERIFICAR","NO CUMPLE"))))`,
    )
    write(10, {
      formula: `IF($B$3="","",_xlfn.TEXTJOIN(", ",TRUE,IF(${applies}*(${covered}=0),${req('B')},"")))`,
      result: '',
      shareType: 'array',
      ref: `J${r}`,
    } as unknown as ExcelJS.CellValue)
  })

  ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: 10 } }
  addStatusRules(ws, 'I', firstRow, lastRow)
  addBanding(ws, `A${firstRow}:J${lastRow}`)
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: HEADER_ROW, showGridLines: false }]
  ws.getRow(2).height = 6
  ws.getRow(5).height = 6
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
}
