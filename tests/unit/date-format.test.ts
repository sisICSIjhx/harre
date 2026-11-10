import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDateValue,
  fromCalendarDate,
  isIsoDate,
  parseDisplayDate,
  toCalendarDate,
} from '../../src/shared/utils/format.js'
import { employeeSchema } from '../../src/features/employees/schemas/employee.schema.js'
import { recordSchema } from '../../src/shared/lib/record-fields.js'

describe('fechas DD/MM/AAAA', () => {
  it.each(['2026-01-02', '2024-02-29', '2000-02-29', '0099-12-31'])(
    'conserva %s al convertir texto y calendario',
    (iso) => {
      expect(parseDisplayDate(formatDate(iso))).toBe(iso)
      expect(fromCalendarDate(toCalendarDate(iso)!)).toBe(iso)
    },
  )
  it.each([
    '31/02/2026',
    '29/02/2025',
    '29/02/1900',
    '01/13/2026',
    '00/01/2026',
    '01/01/0000',
    '1/2/2026',
    '2026-02-01',
    '',
  ])('rechaza la captura inválida %s', (value) => {
    expect(parseDisplayDate(value)).toBeNull()
  })
  it('no interpreta mes/día ni convierte fechas civiles por zona horaria', () => {
    expect(parseDisplayDate('03/04/2026')).toBe('2026-04-03')
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })
  it('representa vacíos y valores inválidos sin lanzar errores', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('2026-02-30')).toBe('—')
    expect(formatDateTime('inválida')).toBe('—')
    expect(formatDateTime(null)).toBe('—')
    expect(isIsoDate('2026-13-01')).toBe(false)
  })
  it('muestra fechas con hora en formato numérico y conserva la hora local', () => {
    const date = new Date(2026, 0, 2, 13, 5)
    expect(formatDateTime(date.toISOString())).toBe('02/01/2026 13:05')
  })
  it('formatea las fechas de auditoría sin alterar textos comunes', () => {
    expect(formatDateValue('hire_date', '2026-04-03')).toBe('03/04/2026')
    expect(formatDateValue('issued_on', '2026-04-03')).toBe('03/04/2026')
    expect(formatDateValue('deadline', '2026-04-03')).toBe('03/04/2026')
    expect(formatDateValue('notes', '2026-04-03')).toBeNull()
    expect(formatDateValue('created_at', new Date(2026, 0, 2, 13, 5).toISOString())).toBe(
      '02/01/2026 13:05',
    )
  })
  it('impide enviar una fecha imposible o captura incompleta a los servicios', () => {
    const employee = { first_name: 'Prueba', employment_status: 'active' }
    const schema = recordSchema([{ key: 'date', label: 'Fecha', type: 'date' }])
    for (const date of ['2026-02-30', '31/02/2026', '12/']) {
      expect(employeeSchema.safeParse({ ...employee, hire_date: date }).success).toBe(false)
      expect(schema.safeParse({ date }).success).toBe(false)
    }
    expect(schema.parse({ date: parseDisplayDate('03/04/2026') })).toEqual({ date: '2026-04-03' })
  })
})
