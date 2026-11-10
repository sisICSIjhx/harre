import type { RecordField } from '../../../shared/lib/record-fields.js'
import { daysBetween, formatMinutes, minutesBetween } from '../../../shared/utils/format.js'

// Sin importar `records.ts`, que depende del cliente de Supabase: así lo usan las pruebas.
type RecordRow = Record<string, unknown>
// Permisos por días u horas. Sin término, el permiso es de un solo día (la base toma la fecha de
// inicio). En los de horas, el horario aplica a cada día del periodo.
export const PERMIT_TYPES = ['Días', 'Horas'] as const
const isHours = (values: Record<string, unknown>) => values.permit_type === 'Horas'
const hhmm = (value: unknown) => String(value).slice(0, 5)

export const PERMIT_FIELDS: RecordField[] = [
  {
    key: 'permit_type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: PERMIT_TYPES,
    initial: 'Días',
  },
  { key: 'start_date', label: 'Inicio', type: 'date', required: true },
  {
    key: 'end_date',
    label: 'Término',
    type: 'date',
    hint: 'Si es de un solo día, déjalo vacío: se toma la fecha de inicio.',
    check: (value, values) =>
      typeof values.start_date === 'string' && String(value) < values.start_date
        ? 'El término no puede ser anterior al inicio'
        : undefined,
  },
  {
    key: 'start_time',
    label: 'Hora de inicio',
    type: 'time',
    required: true,
    visibleWhen: isHours,
  },
  {
    key: 'end_time',
    label: 'Hora de término',
    type: 'time',
    required: true,
    visibleWhen: isHours,
    check: (value, values) =>
      values.start_time && hhmm(value) <= hhmm(values.start_time)
        ? 'La hora de término debe ser posterior a la de inicio'
        : undefined,
  },
  { key: 'reason', label: 'Motivo', type: 'textarea', required: true },
]

// Vista concentrada: además se elige a la persona.
export const PERMIT_FIELDS_WITH_EMPLOYEE: RecordField[] = [
  {
    key: 'employee_id',
    label: 'Persona',
    type: 'lookup',
    required: true,
    lookup: { table: 'vw_employee_directory', label: 'full_name' },
  },
  ...PERMIT_FIELDS,
]

// «3 días», o en permisos por horas «2 h 30 min» (por día, si abarca varios).
export function permitDuration(row: RecordRow): string {
  const days = daysBetween(row.start_date as string | null, row.end_date as string | null)
  if (days === null) return '—'
  const dayText = `${days} ${days === 1 ? 'día' : 'días'}`
  if (row.permit_type !== 'Horas') return dayText
  const minutes = minutesBetween(row.start_time as string | null, row.end_time as string | null)
  if (minutes === null || minutes <= 0) return '—'
  return days === 1 ? formatMinutes(minutes) : `${formatMinutes(minutes)} por día · ${dayText}`
}
