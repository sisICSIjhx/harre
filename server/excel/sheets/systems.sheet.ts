import type { Row, SheetColumn, SheetDefinition } from '../build-workbook.js'

export const EMPLOYEE_NUMBERS_SHEET = 'V_NUM_EMPLEADO'
// Siempre presentes, en este orden; los demás sistemas del catálogo se agregan después.
export const MAIN_SYSTEMS = [
  { name: 'Interno RRHH', header: 'INTERNO RRHH', key: 'number_internal' },
  { name: 'Nómina', header: 'NÓMINA', key: 'number_payroll' },
  { name: 'Checador', header: 'CHECADOR', key: 'number_time_clock' },
] as const

// Una fila por persona con su número activo en cada sistema. Si hubiera más de uno activo en el
// mismo sistema, se separan con coma. El historial completo sigue en V_NUMEROS.
export function employeeNumbersView(
  employees: Row[],
  controlNumbers: Row[],
  systems: Row[],
): [SheetDefinition, Row[]] {
  const main = MAIN_SYSTEMS.map((system) => system.name as string)
  const others = systems
    .map((system) => String(system.name))
    .filter((name) => !main.includes(name))
    .sort((a, b) => a.localeCompare(b, 'es'))
  const systemColumns = [
    ...MAIN_SYSTEMS.map((system) => ({ ...system })),
    ...others.map((name, index) => ({
      name,
      header: name.toUpperCase(),
      key: `number_other_${index}`,
    })),
  ]
  const columns: SheetColumn[] = [
    { header: 'NOMBRE COMPLETO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SEDE', key: 'site', width: 18 },
    { header: 'ESTADO', key: 'status', width: 14 },
    ...systemColumns.map(({ header, key }) => ({ header, key, width: 15 })),
  ]
  const rows = employees.map((employee) => {
    const row: Row = {
      full_name: employee.full_name,
      employee_number: employee.employee_number,
      site: employee.site,
      status: employee.status,
    }
    for (const { name, key } of systemColumns) {
      const active = controlNumbers
        .filter(
          (number) =>
            number.employee_number === employee.employee_number &&
            number.system_name === name &&
            number.status === 'Activo',
        )
        .map((number) => String(number.control_number))
      row[key] = active.length ? active.join(', ') : null
    }
    return row
  })
  const definition: SheetDefinition = {
    name: EMPLOYEE_NUMBERS_SHEET,
    title: 'NÚMEROS DE EMPLEADO | INTERNO RR. HH., NÓMINA Y CHECADOR',
    subtitle:
      'Una fila por persona con su número activo en cada sistema. El historial (asignación, baja y verificación) está en V_NUMEROS.',
    columns,
  }
  return [definition, rows]
}

export const controlNumbersSheet: SheetDefinition = {
  name: 'V_NUMEROS',
  title: 'HISTORIAL DE NÚMEROS DE EMPLEADO EN SISTEMAS',
  subtitle:
    'Una fila por número asignado en Interno RR. HH., Nómina, Checador u otro sistema, activo o dado de baja.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SISTEMA', key: 'system_name', width: 20 },
    { header: 'NÚM. PERSONAL', key: 'control_number', width: 14 },
    { header: 'ESTATUS', key: 'status', width: 11 },
    { header: 'CENTRO DE TRABAJO', key: 'work_center', width: 22 },
    { header: 'ASIGNADO', key: 'assigned_on', kind: 'date', width: 13 },
    { header: 'BAJA', key: 'ended_on', kind: 'date', width: 13 },
    { header: 'VERIFICADO', key: 'verified_on', kind: 'date', width: 13 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const systemsViewSheet: SheetDefinition = {
  name: 'V_SISTEMAS',
  title: 'CATÁLOGO DE SISTEMAS INTERNOS',
  subtitle: 'Sistemas en los que se asigna un número de personal (V_NUMEROS).',
  columns: [
    { header: 'SISTEMA', key: 'name', width: 24 },
    { header: 'FUNCIÓN', key: 'purpose', width: 32 },
    { header: 'ÁREA RESPONSABLE', key: 'responsible_area', width: 22 },
    { header: 'ACTIVO', key: 'is_active', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const systemsSheet: SheetDefinition = {
  name: '23_CAT_SISTEMAS',
  columns: [
    { header: 'Nombre_sistema', key: 'name', width: 24 },
    { header: 'Funcion', key: 'purpose', width: 28 },
    { header: 'Activo', key: 'is_active', kind: 'boolean', width: 8 },
  ],
}
