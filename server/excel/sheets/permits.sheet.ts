import type { SheetDefinition } from '../build-workbook.js'

// DÍAS son naturales, incluidos inicio y término; las horas aplican a cada día del periodo.
export const permitsSheet: SheetDefinition = {
  name: 'V_PERMISOS',
  title: 'PERMISOS DEL PERSONAL',
  subtitle:
    'Una fila por permiso, del más reciente al más antiguo. En los permisos por horas, el horario aplica a cada día del periodo.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'TIPO', key: 'permit_type', width: 9 },
    { header: 'INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'TÉRMINO', key: 'end_date', kind: 'date', width: 13 },
    { header: 'HORA INICIO', key: 'start_time', width: 12 },
    { header: 'HORA TÉRMINO', key: 'end_time', width: 13 },
    { header: 'DÍAS', key: 'days', kind: 'number', width: 8 },
    { header: 'HORAS POR DÍA', key: 'hours_per_day', kind: 'number', width: 14 },
    { header: 'MOTIVO', key: 'reason', width: 50 },
  ],
}
