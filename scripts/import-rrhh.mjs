// Carga inicial desde el libro de RR. HH. a PostgreSQL.
//
//   node scripts/import-rrhh.mjs <archivo.xlsx>                     Solo valida; no escribe.
//   node scripts/import-rrhh.mjs <archivo.xlsx> --apply             Importa a Supabase local.
//   ... --apply --replace-seed     Además retira los datos ficticios de seed.sql.
//   ... --apply --psql "psql <url>"   Usa otra conexión, por ejemplo producción.
//
// Lee el XML porque el libro original no abre con ExcelJS ni con Excel por automatización.
// Todo ocurre en una transacción: si algo falla, no se escribe nada. El informe nunca imprime
// datos personales, solo claves de empleado y conteos.
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import JSZip from 'jszip'

const args = process.argv.slice(2)
const psqlIndex = args.indexOf('--psql')
const file = args.find((arg, index) => !arg.startsWith('--') && (psqlIndex < 0 || index !== psqlIndex + 1))
const apply = args.includes('--apply')
const replaceSeed = args.includes('--replace-seed')
const psqlCommand =
  psqlIndex >= 0 ? args[psqlIndex + 1] : 'docker exec -i supabase_db_icsi-rrhh psql -U postgres -d postgres'

if (!file) {
  console.error('Uso: node scripts/import-rrhh.mjs <archivo.xlsx> [--apply] [--replace-seed] [--psql "..."]')
  process.exit(2)
}

// ---------- Lectura del libro ----------
const decode = (text) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

async function readWorkbook(path) {
  const zip = await JSZip.loadAsync(readFileSync(path))
  const read = async (name) => (zip.file(name) ? zip.file(name).async('string') : '')
  const workbook = await read('xl/workbook.xml')
  const rels = await read('xl/_rels/workbook.xml.rels')
  const targets = Object.fromEntries(
    [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      m[0].match(/Id="([^"]+)"/)[1],
      m[0].match(/Target="([^"]+)"/)[1],
    ]),
  )
  const shared = [...(await read('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  )

  const sheets = {}
  for (const m of workbook.matchAll(/<sheet\b[^>]*\/>/g)) {
    const name = decode(m[0].match(/name="([^"]+)"/)[1])
    const xml = await read(`xl/${targets[m[0].match(/r:id="([^"]+)"/)[1]].replace(/^\/?xl\//, '')}`)
    const rows = new Map()
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      if (!c[2] || /<f\b/.test(c[2])) continue // Las celdas calculadas no se importan.
      const ref = c[1].match(/r="([A-Z]+)(\d+)"/)
      const type = c[1].match(/t="([^"]+)"/)?.[1]
      let value = c[2].match(/<v>([\s\S]*?)<\/v>/)?.[1]
      if (type === 's' && value !== undefined) value = shared[Number(value)]
      else if (type === 'inlineStr') value = decode(c[2].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? '')
      else if (type === 'str' && value !== undefined) value = decode(value)
      else if (value !== undefined && (!type || type === 'n')) value = Number(value)
      if (value === undefined || value === '') continue
      if (!rows.has(Number(ref[2]))) rows.set(Number(ref[2]), {})
      rows.get(Number(ref[2]))[ref[1]] = value
    }
    sheets[name] = rows
  }
  return sheets
}

// ---------- Validación ----------
const problems = new Map()
const warnings = new Map()
const note = (bucket, message, id) => {
  if (!bucket.has(message)) bucket.set(message, [])
  if (id) bucket.get(message).push(id)
}
const problem = (message, id) => note(problems, message, id)
const warn = (message, id) => note(warnings, message, id)

const text = (value) => {
  if (value === undefined || value === null) return null
  const result = String(value).trim()
  return result === '' ? null : result
}

const serialToDate = (serial) => new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10)

function date(value, sheet, id) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number' && value > 10000 && value < 80000) return serialToDate(value)
  const textValue = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(textValue)) return textValue.slice(0, 10)
  warn(`${sheet}: fecha no interpretable, se deja vacía`, id)
  return null
}

const yes = (value, fallback = false) => (value === undefined || value === null ? fallback : value === 'Sí')

function oneOf(value, allowed, sheet, column, id, fallback = null) {
  const result = text(value)
  if (result === null) return fallback
  if (allowed.includes(result)) return result
  warn(`${sheet}: ${column} con valor fuera de catálogo, se deja el predeterminado`, id)
  return fallback
}

function joinNotes(...parts) {
  const items = parts.map(text).filter(Boolean)
  return items.length ? items.join(' | ') : null
}

const EVIDENCE = ['No entregado', 'Recibido', 'Verificado', 'No aplica']
const STATUS = { Activo: 'active', Inactivo: 'terminated', 'En integración': 'onboarding' }

function buildModel(sheets) {
  const data = (name) => [...(sheets[name] ?? new Map()).entries()].filter(([row]) => row > 1)
  const tables = {}
  const add = (table, row) => (tables[table] ??= []).push(row)

  for (const name of ['08_PERFILES', '09_ASIGNACIONES', '10_CURSOS', '11_PERFIL_CURSOS', '12_ACREDITACIONES', '17_CTRL_CURSOS', '22_IDS_SISTEMAS', '13_ESCOLARIDAD']) {
    const count = data(name).filter(([, row]) => Object.keys(row).length).length
    if (count) problem(`${name} trae ${count} filas: este importador no las carga todavía`)
  }

  // Personas.
  const people = new Map()
  const seen = { curp: new Map(), rfc: new Map(), nss: new Map() }
  for (const [, row] of data('01_PERSONAL')) {
    const key = text(row.A)
    if (!key) continue
    if (people.has(key)) {
      problem('01_PERSONAL: EmpleadoID duplicado', key)
      continue
    }
    const id = randomUUID()
    people.set(key, id)
    if (!text(row.B)) problem('01_PERSONAL: falta el nombre', key)
    if (!text(row.C)) warn('01_PERSONAL: sin apellido paterno', key)
    if (!(text(row.K) in STATUS)) warn('01_PERSONAL: estatus vacío o desconocido, se usa Activo', key)
    add('employees', {
      id,
      employee_number: key,
      first_name: text(row.B),
      last_name: text(row.C),
      second_last_name: text(row.D),
      employment_status: STATUS[text(row.K)] ?? 'active',
      notes: text(row.M),
    })
    const sensitive = { curp: text(row.G)?.toUpperCase() ?? null, rfc: text(row.H)?.toUpperCase() ?? null, nss: text(row.I) }
    for (const field of ['curp', 'rfc', 'nss']) {
      const value = sensitive[field]
      if (!value) {
        warn(`01_PERSONAL: sin ${field.toUpperCase()}`, key)
      } else if (seen[field].has(value)) {
        problem(`01_PERSONAL: ${field.toUpperCase()} repetido`, `${seen[field].get(value)}, ${key}`)
      } else {
        seen[field].set(value, key)
      }
    }
    if (sensitive.curp && !/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(sensitive.curp)) {
      warn('01_PERSONAL: CURP con formato no estándar', key)
    }
    if (sensitive.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(sensitive.rfc)) {
      warn('01_PERSONAL: RFC con formato no estándar', key)
    }
    if (sensitive.nss && !/^\d{11}$/.test(sensitive.nss)) warn('01_PERSONAL: NSS no tiene 11 dígitos', key)
    const birth = date(row.F, '01_PERSONAL', key)
    const blood = oneOf(row.J, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'], '01_PERSONAL', 'Tipo_sangre', key)
    if (birth || blood || sensitive.curp || sensitive.rfc || sensitive.nss) {
      add('employee_sensitive_data', { employee_id: id, birth_date: birth, ...sensitive, blood_type: blood })
    }
  }

  // Devuelve el id de la persona o registra una referencia rota.
  const owner = (sheet, row, column = 'B') => {
    const key = text(row[column])
    if (!key) return null
    const id = people.get(key)
    if (!id) problem(`${sheet}: empleado inexistente`, key)
    return id ?? null
  }
  const ordered = (sheet, start, end, id) => {
    if (start && end && end < start) {
      problem(`${sheet}: fecha final anterior a la inicial`, id)
    }
  }

  const CONTRACT_TYPES = [
    'Indeterminado', 'Determinado', 'Por meses', 'Por obra determinada', 'Por ocasión',
    'Por temporada', 'Periodo de prueba', 'Capacitación inicial', 'Proyecto', 'Honorarios', 'Otro',
  ]
  for (const [, row] of data('02_HIST_LABORAL')) {
    const employee = owner('02_HIST_LABORAL', row)
    if (!employee) continue
    const key = text(row.B)
    const hire = date(row.E, '02_HIST_LABORAL', key)
    const end = date(row.G, '02_HIST_LABORAL', key)
    ordered('02_HIST_LABORAL', hire, end, key)
    // El contrato se registra aparte de la alta; el libro solo trae su tipo, sin fechas.
    const contractType = oneOf(row.D, CONTRACT_TYPES, '02_HIST_LABORAL', 'Tipo_contrato', key)
    if (contractType) add('employee_contracts', { employee_id: employee, contract_type: contractType })
    add('employment_records', {
      employee_id: employee,
      company: text(row.C) ?? 'ICSI',
      hire_date: hire,
      imss_registration_date: date(row.F, '02_HIST_LABORAL', key),
      termination_date: end,
      status: oneOf(row.H, ['Activo', 'Finalizado', 'Suspendido'], '02_HIST_LABORAL', 'Estatus', key, 'Activo'),
      work_center: text(row.I),
      area: text(row.J),
      notes: text(row.K),
    })
  }

  for (const [, row] of data('03_TELEFONOS')) {
    const employee = owner('03_TELEFONOS', row)
    if (!employee) continue
    if (!text(row.D)) {
      warn('03_TELEFONOS: fila sin teléfono, se omite', text(row.B))
      continue
    }
    add('employee_phones', {
      employee_id: employee,
      phone_type: text(row.C) ?? 'Otro',
      phone_number: text(row.D),
      extension: text(row.E),
      is_primary: yes(row.F),
      is_current: yes(row.G, true),
      notes: text(row.I),
    })
  }

  const emailsSeen = new Set()
  for (const [, row] of data('04_CORREOS')) {
    const employee = owner('04_CORREOS', row)
    if (!employee) continue
    const key = text(row.B)
    const email = text(row.D)
    if (!email) {
      warn('04_CORREOS: fila sin correo, se omite', key)
      continue
    }
    if (email.indexOf('@') < 1) {
      problem('04_CORREOS: correo sin formato válido', key)
      continue
    }
    if (emailsSeen.has(`${employee}|${email}`)) {
      warn('04_CORREOS: correo repetido en la misma persona, se conserva el primero', key)
      continue
    }
    emailsSeen.add(`${employee}|${email}`)
    add('employee_emails', {
      employee_id: employee,
      email_type: text(row.C) ?? 'Personal',
      email,
      is_primary: yes(row.E),
      is_active: yes(row.F, true),
      notes: text(row.H),
    })
  }

  for (const [, row] of data('05_DOMICILIOS')) {
    const employee = owner('05_DOMICILIOS', row)
    if (!employee) continue
    const key = text(row.B)
    const postal = text(row.H)
    if (postal && !/^\d{5}$/.test(postal)) warn('05_DOMICILIOS: código postal no tiene 5 dígitos', key)
    add('employee_addresses', {
      employee_id: employee,
      address_type: text(row.C) ?? 'Otro',
      street: text(row.D),
      exterior_number: text(row.E),
      interior_number: text(row.F),
      neighborhood: text(row.G),
      postal_code: postal,
      city: text(row.I),
      state: text(row.J),
      country: text(row.K),
      verified_on: date(row.L, '05_DOMICILIOS', key),
      is_current: yes(row.M, true),
      notes: text(row.N),
    })
  }

  for (const [, row] of data('06_EMERGENCIA')) {
    const employee = owner('06_EMERGENCIA', row)
    if (!employee) continue
    if (!text(row.C)) {
      warn('06_EMERGENCIA: fila sin nombre, se omite', text(row.B))
      continue
    }
    add('emergency_contacts', {
      employee_id: employee,
      full_name: text(row.C),
      relationship: text(row.D),
      phone: text(row.E),
      is_primary: yes(row.F),
      notes: text(row.H),
    })
  }

  for (const [, row] of data('07_BENEFICIARIOS')) {
    const employee = owner('07_BENEFICIARIOS', row)
    if (!employee) continue
    if (!text(row.C)) {
      warn('07_BENEFICIARIOS: fila sin nombre, se omite', text(row.B))
      continue
    }
    add('beneficiaries', {
      employee_id: employee,
      full_name: text(row.C),
      relationship: text(row.D),
      phone: text(row.E),
      notes: text(row.F),
    })
  }

  for (const [, row] of data('20_FORMACION_ACAD')) {
    const employee = owner('20_FORMACION_ACAD', row)
    if (!employee) continue
    const key = text(row.B)
    const start = date(row.F, '20_FORMACION_ACAD', key)
    const end = date(row.G, '20_FORMACION_ACAD', key)
    ordered('20_FORMACION_ACAD', start, end, key)
    add('employee_education', {
      employee_id: employee,
      level: text(row.C) ?? 'Otro / por determinar',
      degree_title: text(row.D),
      institution: text(row.E),
      start_date: start,
      end_date: end,
      municipality: text(row.H),
      state: text(row.I),
      country: text(row.J),
      certificate_status: oneOf(row.K, EVIDENCE, '20_FORMACION_ACAD', 'Certificado', key, 'No entregado'),
      diploma_status: oneOf(row.L, EVIDENCE, '20_FORMACION_ACAD', 'Titulo', key, 'No entregado'),
      license_status: oneOf(row.M, EVIDENCE, '20_FORMACION_ACAD', 'Cedula', key, 'No entregado'),
      professional_license: text(row.N),
      validation_status: oneOf(row.O, ['Pendiente', 'En revisión', 'Validado', 'Rechazado'], '20_FORMACION_ACAD', 'Validacion', key, 'Pendiente'),
      is_highest_level: yes(row.Q),
      reviewed_on: date(row.R, '20_FORMACION_ACAD', key),
      reviewed_by: text(row.S),
      notes: joinNotes(row.U, row.T ? `Evidencias: ${text(row.T)}` : null),
    })
  }

  for (const [, row] of data('21_EXPERIENCIA')) {
    const employee = owner('21_EXPERIENCIA', row)
    if (!employee) continue
    const key = text(row.B)
    if (!text(row.C)) warn('21_EXPERIENCIA: sin empresa capturada', key)
    const start = date(row.E, '21_EXPERIENCIA', key)
    const end = date(row.F, '21_EXPERIENCIA', key)
    ordered('21_EXPERIENCIA', start, end, key)
    add('employee_experience', {
      employee_id: employee,
      company: text(row.C),
      company_type: oneOf(row.D, ['ICSI', 'Externa'], '21_EXPERIENCIA', 'Tipo_empresa', key),
      start_date: start,
      end_date: end,
      period_text: text(row.G),
      position_title: text(row.H),
      project_name: text(row.I),
      activities: text(row.J),
      municipality: text(row.K),
      state: text(row.L),
      country: text(row.M),
      work_location_detail: text(row.N),
      work_reference: text(row.O),
      verification_status: oneOf(row.P, ['Sin verificar', 'Referencia disponible', 'Verificado'], '21_EXPERIENCIA', 'Verificacion', key, 'Sin verificar'),
      notes: text(row.Q),
    })
  }

  for (const [, row] of data('24_SEDES_PERSONAL')) {
    const employee = owner('24_SEDES_PERSONAL', row)
    if (!employee || !text(row.C)) continue
    const key = text(row.B)
    const start = date(row.D, '24_SEDES_PERSONAL', key)
    const end = date(row.E, '24_SEDES_PERSONAL', key)
    ordered('24_SEDES_PERSONAL', start, end, key)
    add('employee_work_sites', {
      employee_id: employee,
      site: text(row.C),
      start_date: start,
      end_date: end,
      is_current: yes(row.F, true),
      site_type: text(row.G),
      notes: text(row.H),
    })
  }

  // Control documental: una fila cuando hay algo capturado; el resto se calcula como pendiente.
  const checklistSeen = new Set()
  let untouched = 0
  for (const [, row] of data('16_DOC_PERSONAL')) {
    const employee = owner('16_DOC_PERSONAL', row)
    const code = text(row.C)
    if (!employee || !code) continue
    const key = text(row.B)
    if (!/^DOC-\d{3}$/.test(code)) {
      problem('16_DOC_PERSONAL: documento fuera de catálogo', key)
      continue
    }
    if (checklistSeen.has(`${employee}|${code}`)) {
      problem('16_DOC_PERSONAL: documento repetido en la misma persona', key)
      continue
    }
    checklistSeen.add(`${employee}|${code}`)
    const review = oneOf(row.I, ['Sin revisar', 'Recibido', 'Validado', 'Rechazado'], '16_DOC_PERSONAL', 'Estado_revision', key, 'Sin revisar')
    const fields = {
      manual_decision: oneOf(row.G, ['Requerido', 'No aplica', 'Opcional'], '16_DOC_PERSONAL', 'Decision_manual', key),
      received_on: date(row.J, '16_DOC_PERSONAL', key),
      issued_on: date(row.K, '16_DOC_PERSONAL', key),
      expires_on: date(row.L, '16_DOC_PERSONAL', key),
      validated_by: text(row.M),
      notes: joinNotes(row.P, row.N ? `Ubicación: ${text(row.N)}` : null),
    }
    if (review === 'Sin revisar' && Object.values(fields).every((value) => value === null)) {
      untouched++
      continue
    }
    add('employee_document_checklist', {
      employee_id: employee,
      document_code: code,
      review_status: review,
      ...fields,
      manual_decision: fields.manual_decision ?? 'Requerido',
    })
  }

  return { tables, people, untouched }
}

// ---------- SQL ----------
const literal = (value) => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return `'${String(value).replace(/'/g, "''")}'`
}

const ORDER = [
  'employees',
  'employee_sensitive_data',
  'employment_records',
  'employee_contracts',
  'employee_phones',
  'employee_emails',
  'employee_addresses',
  'emergency_contacts',
  'beneficiaries',
  'employee_education',
  'employee_experience',
  'employee_work_sites',
  'employee_document_checklist',
]

const SEED_CLEANUP = `
do $$
declare
  seed_employees uuid[] := array[
    '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'
  ]::uuid[];
  t text;
begin
  foreach t in array array[
    'employee_assignments', 'employee_courses', 'employee_phones', 'employee_emails',
    'employee_addresses', 'employee_control_numbers', 'emergency_contacts', 'beneficiaries',
    'employee_confidentiality_agreements', 'employee_contracts',
    'employment_records', 'employee_sensitive_data', 'employee_work_sites',
    'employee_education', 'employee_experience', 'employee_course_requirements',
    'employee_document_checklist', 'employee_documents'
  ] loop
    execute format('delete from public.%I where employee_id = any($1)', t) using seed_employees;
  end loop;
  delete from public.employees where id = any(seed_employees);
  delete from public.job_required_courses where job_profile_id in (
    select id from public.job_profiles where name like '%de prueba%');
  delete from public.courses where name like '%de prueba%';
  delete from public.job_profiles where name like '%de prueba%';
  delete from public.projects where name like '%de prueba%';
end;
$$;
`

function buildSql({ tables }) {
  const parts = ['begin;', "set local app.audit_reason = 'Carga inicial desde el libro de RR. HH.';"]
  if (replaceSeed) parts.push(SEED_CLEANUP)
  for (const table of ORDER) {
    const rows = tables[table] ?? []
    if (!rows.length) continue
    if (table === 'employee_document_checklist') {
      const columns = Object.keys(rows[0]).filter((column) => column !== 'document_code')
      for (const row of rows) {
        parts.push(
          `insert into public.${table} (document_type_id, ${columns.join(', ')}) select t.id, ${columns.map((column) => literal(row[column])).join(', ')} from public.document_types t where t.code = ${literal(row.document_code)};`,
        )
      }
      continue
    }
    const columns = Object.keys(rows[0])
    parts.push(`insert into public.${table} (${columns.join(', ')}) values`)
    parts.push(rows.map((row) => `(${columns.map((column) => literal(row[column])).join(', ')})`).join(',\n') + ';')
  }
  parts.push('commit;')
  return parts.join('\n')
}

// ---------- Ejecución ----------
const sheets = await readWorkbook(file)
const model = buildModel(sheets)

console.log('REGISTROS A CARGAR')
for (const table of ORDER) console.log(`  ${table.padEnd(30)} ${model.tables[table]?.length ?? 0}`)
console.log(`  (documentos sin captura, quedan como pendientes: ${model.untouched})`)

const report = (title, bucket) => {
  console.log(`\n${title}: ${bucket.size ? '' : 'ninguno'}`)
  for (const [message, ids] of bucket) {
    const unique = [...new Set(ids)]
    console.log(`  ${message}${ids.length ? ` (${ids.length})` : ''}${unique.length ? `: ${unique.slice(0, 8).join(', ')}${unique.length > 8 ? ', …' : ''}` : ''}`)
  }
}
report('ERRORES, IMPIDEN LA CARGA', problems)
report('AVISOS, NO LA IMPIDEN', warnings)

if (problems.size) {
  console.error('\nNo se importó nada: corrige los errores.')
  process.exit(1)
}
if (!apply) {
  console.log('\nValidación terminada; no se escribió nada. Usa --apply para importar.')
  process.exit(0)
}

const [command, ...commandArgs] = psqlCommand.split(' ')
const result = spawnSync(command, [...commandArgs, '-q', '-v', 'ON_ERROR_STOP=1'], {
  input: buildSql(model),
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 64,
})
if (result.status !== 0) {
  // El mensaje de PostgreSQL puede citar valores: solo se muestra la causa.
  const cause = (result.stderr ?? '').split('\n').find((line) => line.includes('ERROR')) ?? 'error desconocido'
  console.error(`\nLa carga falló y se revirtió por completo: ${cause.split('DETAIL')[0].slice(0, 160)}`)
  process.exit(1)
}
console.log('\nCarga completada.')
