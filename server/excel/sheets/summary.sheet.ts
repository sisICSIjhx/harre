import {
  columnLetter,
  toCellValue,
  type Row,
  type SheetColumn,
  type SheetDefinition,
} from '../build-workbook.js'
import { EMPLOYEE_NUMBERS_SHEET, MAIN_SYSTEMS } from './systems.sheet.js'

export const SUMMARY_SHEET = 'V_CONCENTRADO'
// Primera fila de datos de cada vista: el encabezado está en la fila 5.
const FIRST_ROW = 6
const KEY = 'employee_number'

export type ViewIndex = Map<string, { definition: SheetDefinition; rows: Row[] }>
type Criteria = Record<string, string>

interface SummaryColumn {
  header: string
  key: string
  kind?: SheetColumn['kind']
  width?: number
  // Sin criterios toma la fila de la persona (INDEX/MATCH); con criterios, la última que los
  // cumple (LOOKUP). `fallback` se usa solo si ninguna fila cumple `where`.
  lookup?: { view: string; field: string; where?: Criteria; fallback?: Criteria }
  count?: { view: string; where?: Criteria }
  // Edad en años cumplidos a partir de la columna indicada del propio concentrado.
  ageFrom?: string
}

const DIRECTORY = 'V_DIRECTORIO'
const PERSONAL = 'V_DATOS_PERSONALES'
const FOLLOW_UP = 'V_SEGUIMIENTO'
const LATEST = { is_latest: 'Sí' }
const HIGHEST = { is_highest_level: 'Sí' }
const EMERGENCY = { contact_type: 'Emergencia', is_primary: 'Sí' }
const ANY_EMERGENCY = { contact_type: 'Emergencia' }
const PAYROLL = { account_type: 'Nómina' }
const CONFIDENTIALITY = 'V_CONFIDENCIALIDAD'
const LATEST_LETTER = { document_kind: 'Carta de confidencialidad', is_latest: 'Sí' }
const LATEST_AGREEMENT = { document_kind: 'Acuerdo de confidencialidad', is_latest: 'Sí' }

const pick = (view: string, field: string, where?: Criteria, fallback?: Criteria) => ({
  view,
  field,
  where,
  fallback,
})

const COLUMNS: SummaryColumn[] = [
  // Números de empleado activos en cada sistema principal.
  ...MAIN_SYSTEMS.map(({ header, key }) => ({
    header,
    key,
    width: 14,
    lookup: pick(EMPLOYEE_NUMBERS_SHEET, key),
  })),
  { header: 'ESTADO', key: 'status', width: 14, lookup: pick(DIRECTORY, 'status') },
  { header: 'SEDE', key: 'site', width: 18, lookup: pick(DIRECTORY, 'site') },
  {
    header: 'PUESTO ACTUAL',
    key: 'job_profile',
    width: 30,
    lookup: pick(DIRECTORY, 'job_profile'),
  },
  {
    header: 'FECHA DE ALTA',
    key: 'hire_date',
    kind: 'date',
    width: 13,
    lookup: pick(DIRECTORY, 'hire_date'),
  },
  {
    header: 'FECHA DE BAJA',
    key: 'termination_date',
    kind: 'date',
    width: 13,
    lookup: pick(DIRECTORY, 'termination_date'),
  },
  {
    header: 'FECHA DE NACIMIENTO',
    key: 'birth_date',
    kind: 'date',
    width: 13,
    lookup: pick(PERSONAL, 'birth_date'),
  },
  { header: 'EDAD', key: 'age', kind: 'number', width: 8, ageFrom: 'birth_date' },
  { header: 'CURP', key: 'curp', width: 22, lookup: pick(PERSONAL, 'curp') },
  { header: 'RFC', key: 'rfc', width: 16, lookup: pick(PERSONAL, 'rfc') },
  { header: 'NSS', key: 'nss', width: 14, lookup: pick(PERSONAL, 'nss') },
  { header: 'TIPO DE SANGRE', key: 'blood_type', width: 12, lookup: pick(PERSONAL, 'blood_type') },
  { header: 'ALERGIAS', key: 'allergies', width: 30, lookup: pick(PERSONAL, 'allergies') },
  {
    header: 'CERTIFICADO MÉDICO',
    key: 'has_medical_certificate',
    width: 12,
    lookup: pick(PERSONAL, 'has_medical_certificate'),
  },
  {
    header: 'FECHA CERTIFICADO MÉDICO',
    key: 'medical_certificate_date',
    kind: 'date',
    width: 13,
    lookup: pick(PERSONAL, 'medical_certificate_date'),
  },
  { header: 'TELÉFONO', key: 'phone', width: 17, lookup: pick(DIRECTORY, 'phone') },
  {
    header: 'CORREO LICITACIONES',
    key: 'email_tenders',
    width: 34,
    lookup: pick(DIRECTORY, 'email_tenders'),
  },
  {
    header: 'CORREO CORPORATIVO',
    key: 'email_corporate',
    width: 34,
    lookup: pick(DIRECTORY, 'email_corporate'),
  },
  {
    header: 'CORREO PERSONAL',
    key: 'email_personal',
    width: 34,
    lookup: pick(DIRECTORY, 'email_personal'),
  },
  {
    header: 'DOMICILIO ACTUAL',
    key: 'current_address',
    width: 60,
    lookup: pick(
      'V_DOMICILIOS',
      'full_address',
      { address_type: 'Actual', is_current: 'Sí' },
      { is_current: 'Sí' },
    ),
  },
  {
    header: 'CONTACTO DE EMERGENCIA',
    key: 'emergency_name',
    width: 30,
    lookup: pick('V_CONTACTOS', 'contact_name', EMERGENCY, ANY_EMERGENCY),
  },
  {
    header: 'PARENTESCO EMERGENCIA',
    key: 'emergency_relationship',
    width: 16,
    lookup: pick('V_CONTACTOS', 'relationship', EMERGENCY, ANY_EMERGENCY),
  },
  {
    header: 'TELÉFONO EMERGENCIA',
    key: 'emergency_phone',
    width: 17,
    lookup: pick('V_CONTACTOS', 'phone', EMERGENCY, ANY_EMERGENCY),
  },
  {
    header: 'BENEFICIARIO',
    key: 'beneficiary_name',
    width: 30,
    lookup: pick('V_CONTACTOS', 'contact_name', { contact_type: 'Beneficiario' }),
  },
  {
    header: 'ALTA IMSS',
    key: 'imss_registration_date',
    kind: 'date',
    width: 13,
    lookup: pick('V_ALTAS_BAJAS', 'imss_registration_date', LATEST),
  },
  { header: 'ÁREA', key: 'area', width: 20, lookup: pick('V_ALTAS_BAJAS', 'area', LATEST) },
  {
    header: 'CONTRATO',
    key: 'contract_type',
    width: 20,
    lookup: pick('V_CONTRATOS', 'contract_type', LATEST),
  },
  {
    header: 'INICIO CONTRATO',
    key: 'contract_start',
    kind: 'date',
    width: 13,
    lookup: pick('V_CONTRATOS', 'start_date', LATEST),
  },
  {
    header: 'TÉRMINO CONTRATO',
    key: 'contract_end',
    kind: 'date',
    width: 13,
    lookup: pick('V_CONTRATOS', 'end_date', LATEST),
  },
  {
    header: 'FIRMA CARTA CONFIDENCIALIDAD',
    key: 'confidentiality_letter',
    kind: 'date',
    width: 16,
    lookup: pick(CONFIDENTIALITY, 'signed_on', LATEST_LETTER),
  },
  {
    header: 'FIRMA ACUERDO CONFIDENCIALIDAD',
    key: 'confidentiality_agreement',
    kind: 'date',
    width: 16,
    lookup: pick(CONFIDENTIALITY, 'signed_on', LATEST_AGREEMENT),
  },
  {
    header: 'PUESTOS VIGENTES',
    key: 'current_positions',
    kind: 'number',
    width: 11,
    count: { view: 'V_PUESTOS', where: { state: 'Vigente' } },
  },
  {
    header: 'GRADO MÁXIMO',
    key: 'highest_level',
    width: 20,
    lookup: pick('V_FORMACION', 'level', HIGHEST),
  },
  {
    header: 'CARRERA',
    key: 'degree_title',
    width: 30,
    lookup: pick('V_FORMACION', 'degree_title', HIGHEST),
  },
  {
    header: 'GRADO ACREDITADO',
    key: 'accredited_level',
    width: 26,
    lookup: pick('V_FORMACION', 'accredited_level', HIGHEST),
  },
  {
    header: 'EXPERIENCIAS',
    key: 'experience_count',
    kind: 'number',
    width: 12,
    count: { view: 'V_EXPERIENCIA' },
  },
  {
    header: 'CURSOS EXIGIDOS',
    key: 'courses_required',
    kind: 'number',
    width: 11,
    count: { view: 'V_CAPACITACION' },
  },
  {
    header: 'CURSOS CUBIERTOS',
    key: 'courses_covered',
    kind: 'number',
    width: 11,
    count: { view: 'V_CAPACITACION', where: { compliance: 'Cubierto' } },
  },
  {
    header: 'CURSOS PENDIENTES',
    key: 'courses_pending',
    kind: 'number',
    width: 11,
    lookup: pick(FOLLOW_UP, 'courses_pending'),
  },
  {
    header: 'ACREDITACIONES VIGENTES',
    key: 'accreditations_current',
    kind: 'number',
    width: 14,
    count: { view: 'V_ACREDITACIONES', where: { validity: 'Vigente' } },
  },
  {
    header: 'ACREDITACIONES VENCIDAS',
    key: 'accreditations_expired',
    kind: 'number',
    width: 14,
    count: { view: 'V_ACREDITACIONES', where: { validity: 'Vencido' } },
  },
  {
    header: 'DOCS VALIDADOS',
    key: 'docs_validated',
    kind: 'number',
    width: 11,
    lookup: pick(FOLLOW_UP, 'docs_validated'),
  },
  {
    header: 'DOCS PENDIENTES',
    key: 'docs_pending',
    kind: 'number',
    width: 12,
    lookup: pick(FOLLOW_UP, 'docs_pending'),
  },
  {
    header: 'POR CONFIRMAR',
    key: 'docs_undefined',
    kind: 'number',
    width: 12,
    lookup: pick(FOLLOW_UP, 'docs_undefined'),
  },
  {
    header: 'SITUACIÓN DOCUMENTAL',
    key: 'situation',
    width: 26,
    lookup: pick(FOLLOW_UP, 'situation'),
  },
  {
    header: 'NÚMEROS EN SISTEMAS',
    key: 'control_numbers',
    kind: 'number',
    width: 12,
    count: { view: 'V_NUMEROS' },
  },
  {
    header: 'BANCO NÓMINA',
    key: 'payroll_bank',
    width: 22,
    lookup: pick('V_DATOS_BANCARIOS', 'bank', PAYROLL),
  },
  {
    header: 'CLABE NÓMINA',
    key: 'payroll_clabe',
    width: 22,
    lookup: pick('V_DATOS_BANCARIOS', 'clabe', PAYROLL),
  },
  {
    header: 'CUENTA NÓMINA',
    key: 'payroll_account',
    width: 16,
    lookup: pick('V_DATOS_BANCARIOS', 'account_number', PAYROLL),
  },
  { header: 'OBSERVACIONES', key: 'notes', width: 40, lookup: pick(DIRECTORY, 'notes') },
]

function yearsBetween(birth: string, today: Date): number {
  const [year, month, day] = birth.slice(0, 10).split('-').map(Number) as [number, number, number]
  let age = today.getUTCFullYear() - year
  const beforeBirthday =
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
  if (beforeBirthday) age -= 1
  return age
}

// Una fila por persona; cada celda es una fórmula que busca en otra vista por ID PERSONA, de
// modo que ordenar o filtrar esa vista no altera el concentrado. El resultado guardado es el mismo
// valor calculado desde la instantánea, para vistas previas que no recalculan.
export function summaryView(
  views: ViewIndex,
  employees: Row[],
  today = new Date(),
): [SheetDefinition, Row[]] {
  const source = (view: string) => {
    const found = views.get(view)
    if (!found) throw new Error(`El concentrado usa la vista inexistente ${view}`)
    return found
  }
  const columnOf = (view: string, key: string) => {
    const { definition } = source(view)
    const index = definition.columns.findIndex((column) => column.key === key)
    if (index < 0) throw new Error(`La vista ${view} no tiene la columna ${key}`)
    return { index, column: definition.columns[index] as SheetColumn }
  }
  const range = (view: string, key: string) => {
    const letter = columnLetter(columnOf(view, key).index + 1)
    const last = FIRST_ROW - 1 + Math.max(source(view).rows.length, 1)
    return `'${view}'!$${letter}$${FIRST_ROW}:$${letter}$${last}`
  }
  // Valor tal como aparece en la celda de la vista (Sí/No en los booleanos).
  const shown = (view: string, key: string, value: unknown) => {
    const cell = toCellValue(columnOf(view, key).column, value)
    return cell === null ? '' : String(cell)
  }
  const matches = (view: string, row: Row, number: unknown, where: Criteria = {}) =>
    row[KEY] === number &&
    Object.entries(where).every(([key, value]) => shown(view, key, row[key]) === value)

  // `id` es la celda del propio concentrado con el ID PERSONA de la fila.
  const find = (view: string, field: string, id: string, where?: Criteria) => {
    if (!where) return `INDEX(${range(view, field)},MATCH(${id},${range(view, KEY)},0))`
    const tests = [
      `(${range(view, KEY)}=${id})`,
      ...Object.entries(where).map(([key, value]) => `(${range(view, key)}="${value}")`),
    ]
    return `LOOKUP(2,1/(${tests.join('*')}),${range(view, field)})`
  }
  // Una celda vacía buscada aparece como 0 en Excel: el texto se concatena y la fecha se compara.
  const blankSafe = (kind: SheetColumn['kind'], expr: string) =>
    kind === 'date' ? `IF(${expr}="","",${expr})` : kind === 'number' ? expr : `${expr}&""`

  const letterOf = (key: string) =>
    columnLetter(COLUMNS.findIndex((column) => column.key === key) + 3)

  const columns: SheetColumn[] = [
    { header: 'NOMBRE COMPLETO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: KEY, width: 12 },
  ]
  // El nombre va en la columna A para leer la tabla; las fórmulas buscan por el número, en la B.
  const id = (r: number) => `$B${r}`
  for (const spec of COLUMNS) {
    let formula: (r: number) => string
    if (spec.lookup) {
      const { view, field, where, fallback } = spec.lookup
      formula = (r) => {
        const primary = blankSafe(spec.kind, find(view, field, id(r), where))
        const second = fallback
          ? `IFERROR(${blankSafe(spec.kind, find(view, field, id(r), fallback))},"")`
          : '""'
        return `IFERROR(${primary},${second})`
      }
    } else if (spec.count) {
      const { view, where = {} } = spec.count
      formula = (r) =>
        [
          `COUNTIFS(${range(view, KEY)},${id(r)}`,
          ...Object.entries(where).map(([k, value]) => `,${range(view, k)},"${value}"`),
          ')',
        ].join('')
    } else {
      const birth = letterOf(spec.ageFrom as string)
      formula = (r) => `IF(${birth}${r}="","",DATEDIF(${birth}${r},TODAY(),"Y"))`
    }
    columns.push({
      header: spec.header,
      key: spec.key,
      kind: spec.kind,
      width: spec.width,
      formula,
    })
  }

  const rows = employees.map((employee) => {
    const number = employee[KEY]
    const row: Row = { full_name: employee.full_name, [KEY]: number }
    for (const spec of COLUMNS) {
      if (spec.lookup) {
        const { view, field, where, fallback } = spec.lookup
        const { rows: data } = source(view)
        // LOOKUP devuelve la última coincidencia; MATCH, la primera.
        const choose = (criteria?: Criteria) =>
          criteria
            ? data.filter((item) => matches(view, item, number, criteria)).pop()
            : data.find((item) => item[KEY] === number)
        const found = choose(where) ?? (fallback ? choose(fallback) : undefined)
        row[spec.key] = found ? (found[field] ?? null) : null
      } else if (spec.count) {
        const { view, where } = spec.count
        row[spec.key] = source(view).rows.filter((item) =>
          matches(view, item, number, where),
        ).length
      } else {
        const birth = row[spec.ageFrom as string]
        row[spec.key] = birth ? yearsBetween(String(birth), today) : null
      }
    }
    return row
  })

  const definition: SheetDefinition = {
    name: SUMMARY_SHEET,
    title: 'CONCENTRADO DEL PERSONAL | SOLO RR. HH. AUTORIZADO',
    subtitle:
      'Una fila por persona. Cada dato se lee de su vista por ID PERSONA: contratos y altas toman el ÚLTIMO, formación el GRADO MÁXIMO y domicilio el actual vigente.',
    statusKey: 'situation',
    frozenColumns: 2,
    columns,
  }
  return [definition, rows]
}
