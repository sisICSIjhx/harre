// Fechas civiles: validar y convertir sin desplazarlas por zona horaria.
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= (days[month - 1] ?? 0)
}

export function parseDisplayDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return isIsoDate(iso) ? iso : null
}

export function toCalendarDate(value: string | null | undefined): Date | null {
  if (!value || !isIsoDate(value)) return null
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

export function fromCalendarDate(value: Date): string {
  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value || !isIsoDate(value.slice(0, 10))) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

export function formatDateValue(field: string, value: unknown): string | null {
  if (typeof value !== 'string') return null
  if ((/(?:_date|_on)$/.test(field) || field === 'deadline') && isIsoDate(value))
    return formatDate(value)
  if (field.endsWith('_at') && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value)
  return null
}

// Hora de la base (HH:mm:ss) como HH:mm.
export function formatTime(value: string | null | undefined): string {
  return value && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : '—'
}

const MONEY = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? MONEY.format(amount) : '—'
}

// Minutos entre dos horas HH:mm; nulo si falta alguna.
export function minutesBetween(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
  return toMinutes(end) - toMinutes(start)
}

// Días naturales de un periodo, incluidos inicio y término.
export function daysBetween(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !isIsoDate(start.slice(0, 10))) return null
  const last = end && isIsoDate(end.slice(0, 10)) ? end : start
  const toDay = (value: string) =>
    Date.UTC(+value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10))
  return Math.round((toDay(last) - toDay(start)) / 86_400_000) + 1
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours} h` : '', rest ? `${rest} min` : ''].filter(Boolean).join(' ') || '0 min'
}

// Dos iniciales para el avatar: primera letra de las dos primeras palabras.
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase('es-MX')
}
