import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  buildWorkbook,
  validateWorkbook,
  type WorkbookSnapshot,
} from '../../server/excel/build-workbook.js'

const GENERATED_AT = new Date('2026-11-04T18:00:00Z')
const ONE = { full_name: 'Empleado Ficticio Uno', employee_number: '000123' }
const TWO = { full_name: 'Empleada Ficticia Dos', employee_number: '000124' }

it('publica datos propios de INE y licencia como texto, sin enlaces', async () => {
  const input = {
    ...snapshot,
    documents: [
      {
        ...ONE,
        code: 'DOC-014',
        document_name: 'INE',
        ine_elector_key: 'CLAVE-FICTICIA',
        ine_cic: '000123',
        ine_ocr: '000456',
        document_url: 'https://example.test/privado',
      },
      {
        ...TWO,
        code: 'DOC-012',
        document_name: 'Licencia',
        license_number: '000789',
        license_type: 'Tipo de prueba',
        license_state: 'Estado de prueba',
        license_restrictions: 'Usar lentes',
        license_organ_donor: 'Sí',
      },
    ],
  }
  const buffer = await buildWorkbook(input, GENERATED_AT)
  const workbook = await open(buffer)
  const sheet = workbook.getWorksheet('V_DOCUMENTOS')!
  expect(sheet.getCell('M5').value).toBe('CLAVE DE ELECTOR')
  expect(sheet.getCell('M6').value).toBe('CLAVE-FICTICIA')
  expect(sheet.getCell('N6').value).toBe('000123')
  expect(sheet.getCell('O6').value).toBe('000456')
  expect(sheet.getCell('P7').value).toBe('000789')
  expect(sheet.getCell('P7').numFmt).toBe('@')
  expect(sheet.getCell('Q7').value).toBe('Tipo de prueba')
  expect(sheet.getCell('R7').value).toBe('Estado de prueba')
  expect(sheet.getCell('S5').value).toBe('RESTRICCIONES')
  expect(sheet.getCell('S7').value).toBe('Usar lentes')
  expect(sheet.getCell('T5').value).toBe('DONADOR DE ÓRGANOS')
  expect(sheet.getCell('T7').value).toBe('Sí')
  expect(JSON.stringify(sheet.model)).not.toContain('example.test/privado')
  await expect(validateWorkbook(buffer, input)).resolves.toBeUndefined()
})

const employee = (over: Record<string, unknown>) => ({
  ...ONE,
  status: 'Activo',
  site: 'Sede de prueba',
  job_profile: 'Puesto A',
  phone: '0000000001',
  email_tenders: 'uno@icsi.test',
  email_corporate: null,
  email_personal: null,
  time_clock_number: '00042',
  notes: null,
  docs_validated: 2,
  docs_pending: 1,
  docs_undefined: 0,
  courses_pending: 1,
  birth_date: null,
  curp: null,
  rfc: null,
  nss: null,
  blood_type: null,
  allergies: null,
  has_medical_certificate: null,
  medical_certificate_date: null,
  ...over,
})

const snapshot: WorkbookSnapshot = {
  revision: 3,
  message_ids: [1],
  employees: [
    employee({
      hire_date: '2024-01-15',
      notes: 'Nota ficticia del expediente',
      birth_date: '1990-03-01',
      curp: 'CURPFICTICIA0000',
      rfc: 'RFCFICTICIO00',
      nss: '00000000042',
      blood_type: 'O+',
      allergies: 'Ninguna ficticia',
      has_medical_certificate: 'Sí',
      medical_certificate_date: '2025-02-10',
    }),
    employee({ ...TWO, status: 'Inactivo', notes: null }),
  ],
  phones: [
    {
      ...ONE,
      phone_type: 'Celular',
      phone_number: '0000000001',
      is_primary: true,
      is_current: true,
      updated_on: '2026-01-05',
      notes: 'Solo por la tarde',
    },
  ],
  emails: [
    {
      ...ONE,
      email_type: 'Licitaciones',
      email: 'uno@icsi.test',
      is_primary: true,
      is_active: true,
      notes: null,
    },
    {
      ...ONE,
      email_type: 'Personal',
      email: 'viejo@icsi.test',
      is_primary: false,
      is_active: false,
    },
  ],
  contacts: [
    {
      ...ONE,
      contact_type: 'Emergencia',
      contact_name: 'Contacto A',
      is_primary: true,
      phone: '0000000002',
    },
    {
      ...ONE,
      contact_type: 'Emergencia',
      contact_name: 'Contacto B',
      is_primary: false,
      phone: '0000000003',
    },
    { ...ONE, contact_type: 'Beneficiario', contact_name: 'Beneficiario 1', is_primary: null },
    { ...ONE, contact_type: 'Beneficiario', contact_name: 'Beneficiario 2', is_primary: null },
  ],
  work_sites: [
    { ...ONE, site: 'Sede de prueba', start_date: '2024-01-01', is_current: true },
    {
      ...ONE,
      site: 'Sede anterior',
      start_date: '2022-01-01',
      end_date: '2023-12-31',
      is_current: false,
    },
  ],
  addresses: [
    { ...ONE, address_type: 'Actual', is_current: true, full_address: 'Calle Ficticia 10, Centro' },
    { ...ONE, address_type: 'INE', is_current: true, full_address: 'Calle INE 1' },
  ],
  education: [
    { ...ONE, level: 'Bachillerato', is_highest_level: false },
    {
      ...ONE,
      level: 'Lic./Ing. titulado',
      degree_title: 'Ingeniería ficticia',
      professional_license: '00012345',
      is_highest_level: true,
      accredited_level: 'Pendiente de confirmación',
    },
  ],
  experience: [],
  employment: [
    {
      ...ONE,
      company: 'ICSI',
      hire_date: '2024-01-15',
      imss_registration_date: '2024-01-16',
      status: 'Activo',
      area: 'Operación',
      is_latest: true,
    },
  ],
  contracts: [
    {
      ...ONE,
      contract_type: 'Indeterminado',
      start_date: null,
      end_date: null,
      is_latest: true,
    },
    {
      ...ONE,
      contract_type: 'Por meses',
      start_date: '2024-01-15',
      end_date: '2024-07-14',
      is_latest: false,
      notes: 'Renovado',
    },
  ],
  confidentiality: [
    {
      ...ONE,
      document_kind: 'Acuerdo de confidencialidad',
      signed_on: '2024-07-20',
      is_latest: true,
    },
    {
      ...ONE,
      document_kind: 'Acuerdo de confidencialidad',
      signed_on: '2024-01-16',
      is_latest: false,
    },
    {
      ...ONE,
      document_kind: 'Carta de confidencialidad',
      signed_on: '2024-01-16',
      is_latest: true,
      notes: 'Firmada al ingreso',
    },
    {
      ...ONE,
      document_kind: 'Resguardo de casillero',
      signed_on: '2024-02-01',
      is_latest: true,
      notes: 'Casillero 12',
    },
    {
      ...ONE,
      document_kind: 'Resguardo de vehículo',
      signed_on: '2024-03-01',
      is_latest: true,
      notes: 'Unidad de prueba',
    },
    {
      ...ONE,
      document_kind: 'Reglamento',
      signed_on: '2024-06-01',
      is_latest: true,
      notes: 'Reglamento de prueba',
    },
    {
      ...ONE,
      document_kind: 'Acta administrativa',
      signed_on: '2024-04-02',
      is_latest: true,
      notes: 'Acta ficticia',
    },
    {
      ...ONE,
      document_kind: 'Préstamo',
      signed_on: '2024-05-03',
      amount: 5000,
      is_latest: true,
    },
  ],
  permits: [
    {
      ...ONE,
      permit_type: 'Horas',
      start_date: '2024-06-10',
      end_date: '2024-06-10',
      start_time: '09:00',
      end_time: '11:30',
      days: 1,
      hours_per_day: 2.5,
      reason: 'Motivo ficticio',
    },
    {
      ...ONE,
      permit_type: 'Días',
      start_date: '2024-06-03',
      end_date: '2024-06-05',
      start_time: null,
      end_time: null,
      days: 3,
      hours_per_day: null,
      reason: 'Otro motivo ficticio',
    },
  ],
  job_profiles: [{ name: 'Puesto A', is_active: true }],
  projects: [{ name: 'Proyecto 1', status: 'En ejecución', people: 1 }],
  assignments: [
    {
      ...ONE,
      job_profile: 'Puesto A',
      project: 'Proyecto 1',
      start_date: '2024-01-01',
      end_date: null,
      is_primary: true,
    },
    {
      ...ONE,
      job_profile: 'Puesto B',
      project: null,
      start_date: '2020-01-01',
      end_date: '2021-01-01',
      is_primary: false,
    },
  ],
  courses: [{ name: 'Curso 1', validity_months: 12, is_active: true }],
  requirements: [{ job_profile: 'Puesto A', course: 'Curso 1', is_mandatory: true }],
  accreditations: [
    {
      ...ONE,
      course: 'Curso 1',
      completed_on: '2020-01-10',
      expires_on: '2021-01-10',
      validity_months: 12,
      validity: 'Vencido',
    },
  ],
  course_controls: [{ ...ONE, course: 'Curso 1', is_mandatory: true, compliance: 'Vencido' }],
  documents: [
    {
      ...ONE,
      code: 'DOC-001',
      document_name: 'CV',
      applies: 'Requerido',
      review_status: 'Sin revisar',
      traffic_light: 'PENDIENTE',
    },
  ],
  document_types: [{ code: 'DOC-001', name: 'CV' }],
  systems: [
    { name: 'Checador', is_active: true },
    { name: 'Interno RRHH', is_active: true },
    { name: 'Nómina', is_active: true },
    { name: 'Sistema Extra', is_active: true },
  ],
  // Sin datos personales: números ficticios con ceros iniciales.
  control_numbers: [
    { ...ONE, system_name: 'Checador', control_number: '00042', status: 'Activo' },
    { ...ONE, system_name: 'Interno RRHH', control_number: '0007', status: 'Activo' },
    { ...ONE, system_name: 'Nómina', control_number: '0099', status: 'Inactivo' },
    { ...ONE, system_name: 'Nómina', control_number: '0100', status: 'Activo' },
  ],
  // Números de crédito ficticios.
  credits: [
    { ...ONE, credit_type: 'FONACOT', credit_number: '000987' },
    { ...ONE, credit_type: 'INFONAVIT', credit_number: '0012345678' },
  ],
  // CLABE y cuentas ficticias; la fila sin cuenta es la marca que arma la instantánea.
  bank_accounts: [
    {
      ...ONE,
      status: 'Activo',
      account_type: 'Alternativa',
      bank: 'Banco ficticio',
      clabe: '000180000000000030',
      account_number: '0000000099',
      holder_name: 'Titular ficticio',
      control_note: null,
    },
    {
      ...ONE,
      status: 'Activo',
      account_type: 'Nómina',
      bank: 'Banco ficticio',
      clabe: '012180000000000015',
      account_number: null,
      holder_name: null,
      control_note: null,
    },
    {
      full_name: 'Empleado Ficticio Tres',
      employee_number: '000125',
      status: 'Activo',
      account_type: null,
      bank: null,
      clabe: null,
      account_number: null,
      holder_name: null,
      control_note: 'Sin cuenta de nómina',
    },
  ],
}

async function open(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  return workbook
}

const build = async () => open(await buildWorkbook(snapshot, GENERATED_AT))
const headersOf = (sheet: ExcelJS.Worksheet | undefined) =>
  (sheet?.getRow(5).values as string[]).filter(Boolean)

function homeLinks(workbook: ExcelJS.Workbook): string[] {
  const links: string[] = []
  workbook
    .getWorksheet('V_INICIO')
    ?.getColumn(1)
    .eachCell((cell) => {
      const formula = (cell.value as ExcelJS.CellFormulaValue | null)?.formula
      if (formula) links.push(formula)
    })
  return links
}

// Resultado guardado y fórmula de una columna del concentrado, buscada por encabezado.
function summaryCell(workbook: ExcelJS.Workbook, header: string, row: number) {
  const sheet = workbook.getWorksheet('V_CONCENTRADO')
  const index = headersOf(sheet).indexOf(header)
  if (index < 0) throw new Error(`Sin columna ${header}`)
  const value = sheet?.getRow(row).getCell(index + 1).value as ExcelJS.CellFormulaValue
  const result =
    value.result instanceof Date ? value.result.toISOString().slice(0, 10) : value.result
  return { formula: value.formula, result: result ?? '' }
}

describe('buildWorkbook', () => {
  it('muestra las vistas, oculta los catálogos y supera su validación', async () => {
    const buffer = await buildWorkbook(snapshot, GENERATED_AT)
    await expect(validateWorkbook(buffer, snapshot)).resolves.toBeUndefined()

    const workbook = await open(buffer)
    const visible = workbook.worksheets
      .filter((sheet) => sheet.state !== 'hidden')
      .map((sheet) => sheet.name)
    const hidden = workbook.worksheets
      .filter((sheet) => sheet.state === 'hidden')
      .map((sheet) => sheet.name)
    expect(visible.slice(0, 3)).toEqual(['V_INICIO', 'V_CONCENTRADO', 'V_LICITACIONES'])
    expect(visible).toHaveLength(36)
    for (const name of [
      'V_ALTAS_BAJAS',
      'V_CONFIDENCIALIDAD',
      'V_RESGUARDO_CASILLERO',
      'V_RESGUARDO_VEHICULO',
      'V_REGLAMENTO',
      'V_ACTAS_ADMINISTRATIVAS',
      'V_PRESTAMOS',
      'V_PERMISOS',
      'V_CREDITOS',
      'V_DATOS_BANCARIOS',
      'V_DATOS_PERSONALES',
      'V_SEDES',
      'V_CURSOS',
      'V_PERFILES',
      'V_CAT_DOCUMENTOS',
      'V_SISTEMAS',
      'V_NUM_EMPLEADO',
    ]) {
      expect(visible).toContain(name)
    }
    expect(visible.every((name) => name.startsWith('V_'))).toBe(true)
    expect(hidden).toHaveLength(9)
    expect(hidden).toContain('08_PERFILES')
    expect(hidden).toContain('10_CURSOS')
  })

  it('enlaza cada vista desde V_INICIO', async () => {
    const workbook = await build()
    const links = homeLinks(workbook)
    workbook.worksheets
      .filter((sheet) => sheet.state !== 'hidden' && sheet.name !== 'V_INICIO')
      .forEach((sheet) =>
        expect(links).toContain(`HYPERLINK("#'${sheet.name}'!A1","${sheet.name}")`),
      )
  })

  it('las vistas por persona llevan el número de empleado como texto', async () => {
    const workbook = await build()
    workbook.worksheets
      .filter((sheet) => headersOf(sheet).includes('ID PERSONA'))
      .forEach((sheet) => {
        const column = headersOf(sheet).indexOf('ID PERSONA') + 1
        const value = sheet.getRow(6).getCell(column).value
        if (value !== null) expect(value).toMatch(/^0001\d\d$/)
      })
    expect(headersOf(workbook.getWorksheet('V_DIRECTORIO'))[1]).toBe('ID PERSONA')
    expect(headersOf(workbook.getWorksheet('V_DOCUMENTOS'))[1]).toBe('ID PERSONA')
  })

  it('publica los datos personales en una fila por persona', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_DATOS_PERSONALES')
    expect(headersOf(sheet)).toEqual([
      'NOMBRE COMPLETO',
      'ID PERSONA',
      'FECHA DE NACIMIENTO',
      'CURP',
      'RFC',
      'NSS',
      'TIPO DE SANGRE',
      'ALERGIAS',
      'CERTIFICADO MÉDICO',
      'FECHA CERTIFICADO MÉDICO',
    ])
    expect(sheet?.getCell('B6').value).toBe('000123')
    expect((sheet?.getCell('C6').value as Date).toISOString().slice(0, 10)).toBe('1990-03-01')
    expect(sheet?.getCell('D6').value).toBe('CURPFICTICIA0000')
    expect(sheet?.getCell('E6').value).toBe('RFCFICTICIO00')
    expect(sheet?.getCell('F6').value).toBe('00000000042')
    expect(sheet?.getCell('G6').value).toBe('O+')
    expect(sheet?.getCell('H6').value).toBe('Ninguna ficticia')
    expect(sheet?.getCell('I6').value).toBe('Sí')
    expect((sheet?.getCell('J6').value as Date).toISOString().slice(0, 10)).toBe('2025-02-10')
  })

  it('deja vacías las celdas de quien no tiene datos personales capturados', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_DATOS_PERSONALES')
    expect(sheet?.getCell('A7').value).toBe('Empleada Ficticia Dos')
    for (const column of ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      expect(sheet?.getCell(`${column}7`).value).toBeNull()
    }
  })

  it('los datos personales solo aparecen en V_DATOS_PERSONALES y V_CONCENTRADO', async () => {
    const workbook = await build()
    workbook.worksheets.forEach((sheet) => {
      if (['V_DATOS_PERSONALES', 'V_CONCENTRADO'].includes(sheet.name)) return
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value !== 'string' || cell.value.length >= 40) return
          expect(cell.value).not.toMatch(
            /FICTICI[OA]\d|00000000042|^(CURP|RFC|NSS)\b|NACIMIENTO|SANGRE|ALERGIA/i,
          )
        })
      })
    })
  })

  it('publica observaciones salvo en cuentas bancarias, y nunca fotografía ni enlaces', async () => {
    const workbook = await build()
    workbook.worksheets.forEach((sheet) => {
      const headers = headersOf(sheet).join(' | ')
      expect(headers).not.toMatch(/FOTO|ENLACE|URL|COMPROBANTE/i)
      if (sheet.name === 'V_DATOS_BANCARIOS') expect(headers).not.toMatch(/OBSERVACION/i)
    })
    const directory = workbook.getWorksheet('V_DIRECTORIO')
    expect(headersOf(directory).at(-1)).toBe('OBSERVACIONES')
    expect(directory?.getCell('M6').value).toBe('Nota ficticia del expediente')
    for (const name of [
      'V_TELEFONOS',
      'V_DOMICILIOS',
      'V_FORMACION',
      'V_CONTRATOS',
      'V_DOCUMENTOS',
    ]) {
      expect(headersOf(workbook.getWorksheet(name))).toContain('OBSERVACIONES')
    }
  })

  it('agrupa correos por persona y conserva una fila por contacto y por sede', async () => {
    const workbook = await build()
    const rowsOf = (name: string) => (workbook.getWorksheet(name)?.actualRowCount ?? 0) - 3
    expect(rowsOf('V_CORREOS')).toBe(2)
    expect(rowsOf('V_CONTACTOS')).toBe(4)
    expect(rowsOf('V_SEDES')).toBe(2)
    const contacts = workbook.getWorksheet('V_CONTACTOS')
    expect(contacts?.getCell('D8').value).toBe('Beneficiario')
    expect(contacts?.getCell('E8').value).toBe('Beneficiario 1')
    const emails = workbook.getWorksheet('V_CORREOS')
    expect(headersOf(emails)).toEqual([
      'PERSONAL ADSCRITO',
      'ID PERSONA',
      'UBICACIÓN',
      'PERSONAL',
      'CORPORATIVO',
      'LICITACIONES',
      'OBSERVACIONES',
    ])
    expect(emails?.getCell('D6').value).toBe('viejo@icsi.test (inactivo)')
    expect(emails?.getCell('F6').value).toBe('uno@icsi.test (principal)')
    expect(emails?.getCell('B7').value).toBe(TWO.employee_number)
    expect(emails?.getCell('F7').value).toBeNull()
  })

  it('conserva varios correos del mismo tipo y sus observaciones sin mezclar personas', async () => {
    const input = {
      ...snapshot,
      emails: [
        ...snapshot.emails,
        {
          ...ONE,
          email_type: 'Licitaciones',
          email: 'dos@icsi.test',
          is_active: true,
          notes: 'Alternativo',
        },
        { ...TWO, email_type: 'Corporativo', email: 'tres@icsi.test', is_active: true },
      ],
    }
    const buffer = await buildWorkbook(input, GENERATED_AT)
    await validateWorkbook(buffer, input)
    const sheet = (await open(buffer)).getWorksheet('V_CORREOS')
    expect(sheet?.getCell('F6').value).toBe('uno@icsi.test (principal)\ndos@icsi.test')
    expect(sheet?.getCell('G6').value).toBe('Licitaciones — dos@icsi.test: Alternativo')
    expect(sheet?.getCell('E7').value).toBe('tres@icsi.test')
    expect(sheet?.getCell('F6').alignment.wrapText).toBe(true)
  })

  it('V_NUM_EMPLEADO muestra por persona el número activo de Interno RRHH, Nómina y Checador', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_NUM_EMPLEADO')
    expect(headersOf(sheet)).toEqual([
      'NOMBRE COMPLETO',
      'ID PERSONA',
      'SEDE',
      'ESTADO',
      'INTERNO RRHH',
      'NÓMINA',
      'CHECADOR',
      'SISTEMA EXTRA',
    ])
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(2)
    // El número inactivo de Nómina queda solo en el historial (V_NUMEROS).
    expect(sheet?.getCell('E6').value).toBe('0007')
    expect(sheet?.getCell('F6').value).toBe('0100')
    expect(sheet?.getCell('G6').value).toBe('00042')
    expect(sheet?.getCell('F6').numFmt).toBe('@')
    expect(sheet?.getCell('H6').value).toBeNull()
    expect(sheet?.getCell('A7').value).toBe('Empleada Ficticia Dos')
    expect(sheet?.getCell('E7').value).toBeNull()
  })

  it('conserva ceros iniciales como texto', async () => {
    const workbook = await build()
    expect(workbook.getWorksheet('01_PERSONAL')?.getCell('A2').value).toBe('000123')
    expect(workbook.getWorksheet('V_TELEFONOS')?.getCell('E6').value).toBe('0000000001')
    expect(workbook.getWorksheet('V_NUMEROS')?.getCell('D6').value).toBe('00042')
    expect(workbook.getWorksheet('V_FORMACION')?.getCell('F7').value).toBe('00012345')
  })

  it('escribe fechas civiles sin desplazarlas', async () => {
    const workbook = await build()
    const value = workbook.getWorksheet('V_ALTAS_BAJAS')?.getCell('D6').value as Date
    expect(value.toISOString().slice(0, 10)).toBe('2024-01-15')
  })

  it('separa altas y bajas de los contratos y marca el último', async () => {
    const workbook = await build()
    expect(headersOf(workbook.getWorksheet('V_ALTAS_BAJAS'))).not.toContain('CONTRATO')
    expect(headersOf(workbook.getWorksheet('V_CONTRATOS'))).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'CONTRATO',
      'INICIO',
      'TÉRMINO',
      'ÚLTIMO',
      'OBSERVACIONES',
    ])
    const sheet = workbook.getWorksheet('V_CONTRATOS')
    const isoOf = (cell: string) => (sheet?.getCell(cell).value as Date).toISOString().slice(0, 10)
    expect(sheet?.getCell('C6').value).toBe('Indeterminado')
    expect(sheet?.getCell('F6').value).toBe('Sí')
    expect(sheet?.getCell('C7').value).toBe('Por meses')
    expect(isoOf('D7')).toBe('2024-01-15')
    expect(isoOf('E7')).toBe('2024-07-14')
    expect(sheet?.getCell('F7').value).toBe('No')
  })

  it('publica la confidencialidad por persona, sin contrato ni enlace', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_CONFIDENCIALIDAD')
    expect(headersOf(sheet)).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'DOCUMENTO',
      'FECHA DE FIRMA',
      'ÚLTIMO',
      'OBSERVACIONES',
    ])
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(3)
    expect(sheet?.getCell('C6').value).toBe('Acuerdo de confidencialidad')
    expect((sheet?.getCell('D6').value as Date).toISOString().slice(0, 10)).toBe('2024-07-20')
    expect(sheet?.getCell('E7').value).toBe('No')
    expect(sheet?.getCell('F8').value).toBe('Firmada al ingreso')
  })

  it('publica los resguardos de casillero en su propia vista, sin enlace', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_RESGUARDO_CASILLERO')
    expect(headersOf(sheet)).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'FECHA DE FIRMA',
      'ÚLTIMO',
      'OBSERVACIONES',
    ])
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(1)
    expect((sheet?.getCell('C6').value as Date).toISOString().slice(0, 10)).toBe('2024-02-01')
    expect(sheet?.getCell('D6').value).toBe('Sí')
    expect(sheet?.getCell('E6').value).toBe('Casillero 12')
  })

  it('publica resguardos de vehículo, actas y préstamos en sus propias vistas', async () => {
    const workbook = await build()
    const vehicle = workbook.getWorksheet('V_RESGUARDO_VEHICULO')
    expect((vehicle?.actualRowCount ?? 0) - 3).toBe(1)
    expect(vehicle?.getCell('E6').value).toBe('Unidad de prueba')

    const regulations = workbook.getWorksheet('V_REGLAMENTO')
    expect((regulations?.actualRowCount ?? 0) - 3).toBe(1)
    expect(regulations?.getCell('E6').value).toBe('Reglamento de prueba')

    const acts = workbook.getWorksheet('V_ACTAS_ADMINISTRATIVAS')
    expect(headersOf(acts)).toEqual(['EMPLEADO', 'ID PERSONA', 'FECHA', 'OBSERVACIONES'])
    expect((acts?.getCell('C6').value as Date).toISOString().slice(0, 10)).toBe('2024-04-02')

    const loans = workbook.getWorksheet('V_PRESTAMOS')
    expect(headersOf(loans)).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'FECHA',
      'CANTIDAD',
      'OBSERVACIONES',
    ])
    expect(loans?.getCell('D6').value).toBe(5000)
    expect(loans?.getCell('D6').numFmt).toBe('"$"#,##0.00')

    const kinds = workbook
      .getWorksheet('V_CONFIDENCIALIDAD')
      ?.getColumn(3)
      .values.slice(6)
      .filter(Boolean)
    expect(new Set(kinds)).toEqual(
      new Set(['Acuerdo de confidencialidad', 'Carta de confidencialidad']),
    )
  })

  it('publica los permisos con su periodo, horario y motivo', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_PERMISOS')
    expect(headersOf(sheet)).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'TIPO',
      'INICIO',
      'TÉRMINO',
      'HORA INICIO',
      'HORA TÉRMINO',
      'DÍAS',
      'HORAS POR DÍA',
      'MOTIVO',
    ])
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(2)
    expect(sheet?.getCell('C6').value).toBe('Horas')
    expect(sheet?.getCell('F6').value).toBe('09:00')
    expect(sheet?.getCell('G6').value).toBe('11:30')
    expect(sheet?.getCell('I6').value).toBe(2.5)
    expect(sheet?.getCell('J6').value).toBe('Motivo ficticio')
    expect(sheet?.getCell('H7').value).toBe(3)
    expect(sheet?.getCell('F7').value).toBeNull()
  })

  it('el historial de puestos marca lo terminado y distingue puesto base', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_PUESTOS')
    expect((sheet?.getCell('H6').value as ExcelJS.CellFormulaValue).result).toBe('Vigente')
    expect((sheet?.getCell('H7').value as ExcelJS.CellFormulaValue).result).toBe('Histórico')
    expect(sheet?.getCell('D7').value).toBe('Sin proyecto (puesto base)')
  })

  it('V_CONCENTRADO resume a cada persona con fórmulas por número de empleado', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_CONCENTRADO')
    expect(sheet?.getCell('A6').value).toBe('Empleado Ficticio Uno')
    expect(sheet?.getCell('B6').value).toBe('000123')
    expect(sheet?.getCell('B7').value).toBe('000124')
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(2)

    const one = (header: string) => summaryCell(workbook, header, 6).result
    expect(one('INTERNO RRHH')).toBe('0007')
    expect(one('NÓMINA')).toBe('0100')
    expect(one('CHECADOR')).toBe('00042')
    expect(summaryCell(workbook, 'NÓMINA', 6).formula).toContain("'V_NUM_EMPLEADO'!")
    expect(one('SEDE')).toBe('Sede de prueba')
    expect(one('CURP')).toBe('CURPFICTICIA0000')
    expect(one('EDAD')).toBe(36)
    expect(one('CERTIFICADO MÉDICO')).toBe('Sí')
    expect(one('FECHA CERTIFICADO MÉDICO')).toBe('2025-02-10')
    expect(one('DOMICILIO ACTUAL')).toBe('Calle Ficticia 10, Centro')
    expect(one('CONTACTO DE EMERGENCIA')).toBe('Contacto A')
    expect(one('TELÉFONO EMERGENCIA')).toBe('0000000002')
    expect(one('BENEFICIARIO')).toBe('Beneficiario 2')
    expect(one('ALTA IMSS')).toBe('2024-01-16')
    expect(one('CONTRATO')).toBe('Indeterminado')
    expect(one('FIRMA ACUERDO CONFIDENCIALIDAD')).toBe('2024-07-20')
    expect(one('FIRMA CARTA CONFIDENCIALIDAD')).toBe('2024-01-16')
    expect(one('GRADO MÁXIMO')).toBe('Lic./Ing. titulado')
    expect(one('PUESTOS VIGENTES')).toBe(1)
    expect(one('CURSOS EXIGIDOS')).toBe(1)
    // ExcelJS no guarda un resultado igual a 0; Excel lo recalcula al abrir (fullCalcOnLoad).
    expect(one('CURSOS CUBIERTOS')).toBe('')
    expect(one('ACREDITACIONES VENCIDAS')).toBe(1)
    expect(one('SITUACIÓN DOCUMENTAL')).toBe('INCOMPLETO')
    expect(one('CLABE NÓMINA')).toBe('012180000000000015')
    expect(one('OBSERVACIONES')).toBe('Nota ficticia del expediente')

    const two = (header: string) => summaryCell(workbook, header, 7).result
    expect(two('DOMICILIO ACTUAL')).toBe('')
    expect(two('CONTRATO')).toBe('')
    expect(two('EDAD')).toBe('')
    expect(two('CURSOS EXIGIDOS')).toBe('')
    expect(two('SITUACIÓN DOCUMENTAL')).toBe('BAJA')

    const contract = summaryCell(workbook, 'CONTRATO', 6).formula
    expect(contract).toContain("'V_CONTRATOS'!$C$6:$C$7")
    expect(contract).toContain('\'V_CONTRATOS\'!$F$6:$F$7="Sí"')
    expect(contract).toContain('$B6')
    expect(summaryCell(workbook, 'CURP', 6).formula).toBe(
      'IFERROR(INDEX(\'V_DATOS_PERSONALES\'!$D$6:$D$7,MATCH($B6,\'V_DATOS_PERSONALES\'!$B$6:$B$7,0))&"","")',
    )
    expect(summaryCell(workbook, 'DOMICILIO ACTUAL', 6).formula).toMatch(/^IFERROR\(.+IFERROR\(/)
  })

  it('V_LICITACIONES usa los catálogos ocultos y enlaza por número de empleado', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_LICITACIONES')
    expect(sheet?.getCell('A7').value).toBe('Empleado Ficticio Uno')
    expect(sheet?.getCell('L7').value).toBe('000123')
    expect(sheet?.getColumn(12).hidden).toBe(true)
    const formula = (sheet?.getCell('G7').value as ExcelJS.CellFormulaValue).formula
    expect(formula).toContain("'11_PERFIL_CURSOS'!$A$2:$A$2")
    expect(formula).toContain("'12_ACREDITACIONES'!$I$2:$I$2")
  })

  it('funciona sin catálogos ni registros capturados', async () => {
    const empty: WorkbookSnapshot = {
      ...snapshot,
      job_profiles: [],
      projects: [],
      assignments: [],
      courses: [],
      requirements: [],
      accreditations: [],
      course_controls: [],
      emails: [],
      contacts: [],
      work_sites: [],
      addresses: [],
      education: [],
      contracts: [],
      confidentiality: [],
      credits: [],
      permits: [],
      employment: [],
    }
    const buffer = await buildWorkbook(empty)
    await expect(validateWorkbook(buffer, empty)).resolves.toBeUndefined()
  })

  it('la validación detecta un conteo distinto en las vistas por persona', async () => {
    const buffer = await buildWorkbook(snapshot)
    await expect(
      validateWorkbook(buffer, { ...snapshot, employees: snapshot.employees.slice(0, 1) }),
    ).rejects.toThrow('Conteo incorrecto en V_CONCENTRADO')
  })

  it('publica una fila por cuenta y la marca de quien no tiene cuenta de nómina', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_DATOS_BANCARIOS')
    expect(headersOf(sheet)).toEqual([
      'EMPLEADO',
      'ID PERSONA',
      'ESTATUS',
      'TIPO DE CUENTA',
      'BANCO',
      'CLABE',
      'NÚM. DE CUENTA',
      'TITULAR',
      'AVISO',
    ])
    expect(sheet?.getCell('D6').value).toBe('Alternativa')
    expect(sheet?.getCell('D7').value).toBe('Nómina')
    expect(sheet?.getCell('A8').value).toBe('Empleado Ficticio Tres')
    expect(sheet?.getCell('F8').value).toBeNull()
    expect(sheet?.getCell('I8').value).toBe('Sin cuenta de nómina')
  })

  it('publica una fila por crédito con su número como texto', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_CREDITOS')
    expect(headersOf(sheet)).toEqual(['EMPLEADO', 'ID PERSONA', 'CRÉDITO', 'NÚMERO DE CRÉDITO'])
    expect((sheet?.actualRowCount ?? 0) - 3).toBe(2)
    expect(sheet?.getCell('C6').value).toBe('FONACOT')
    expect(sheet?.getCell('D6').value).toBe('000987')
    expect(sheet?.getCell('C7').value).toBe('INFONAVIT')
    expect(sheet?.getCell('D7').value).toBe('0012345678')
  })

  it('conserva ceros iniciales en CLABE y número de cuenta', async () => {
    const workbook = await build()
    const sheet = workbook.getWorksheet('V_DATOS_BANCARIOS')
    expect(sheet?.getCell('F6').value).toBe('000180000000000030')
    expect(sheet?.getCell('F6').numFmt).toBe('@')
    expect(sheet?.getCell('G6').value).toBe('0000000099')
  })

  it('la validación detecta un conteo distinto en V_DATOS_BANCARIOS', async () => {
    const buffer = await buildWorkbook(snapshot)
    await expect(
      validateWorkbook(buffer, { ...snapshot, bank_accounts: snapshot.bank_accounts.slice(0, 2) }),
    ).rejects.toThrow('Conteo incorrecto en V_DATOS_BANCARIOS')
  })

  it('la validación detecta un conteo distinto', async () => {
    const buffer = await buildWorkbook(snapshot)
    await expect(validateWorkbook(buffer, { ...snapshot, phones: [] })).rejects.toThrow(
      'Conteo incorrecto',
    )
  })
})
