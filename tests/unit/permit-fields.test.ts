import { describe, expect, it } from 'vitest'
import { SIGNED_DOCUMENTS } from '../../src/features/employees/schemas/signed-document.fields.js'
import {
  PERMIT_FIELDS,
  PERMIT_FIELDS_WITH_EMPLOYEE,
  permitDuration,
} from '../../src/features/leave/schemas/permit.fields.js'
import { recordSchema, withoutHiddenValues } from '../../src/shared/lib/record-fields.js'
import { formatMoney, formatTime } from '../../src/shared/utils/format.js'

const schema = recordSchema(PERMIT_FIELDS)
const errorsOf = (values: Record<string, unknown>) => {
  const result = schema.safeParse(values)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
}

describe('captura de permisos', () => {
  it('acepta un permiso de un día sin fecha de término ni horas', () => {
    const result = schema.parse({
      permit_type: 'Días',
      start_date: '2026-11-10',
      end_date: null,
      start_time: null,
      end_time: null,
      reason: ' Trámite personal ',
    })
    expect(result).toMatchObject({ end_date: null, start_time: null, reason: 'Trámite personal' })
  })

  it('exige fecha de inicio y motivo', () => {
    expect(errorsOf({ permit_type: 'Días', start_date: null, reason: '' })).toMatchObject({
      start_date: 'Captura inicio',
      reason: 'Captura motivo',
    })
  })

  it('exige las horas solo en permisos por horas', () => {
    expect(errorsOf({ permit_type: 'Horas', start_date: '2026-11-10', reason: 'Cita' })).toEqual({
      start_time: 'Captura hora de inicio',
      end_time: 'Captura hora de término',
    })
    expect(errorsOf({ permit_type: 'Días', start_date: '2026-11-10', reason: 'Cita' })).toEqual({})
  })

  it('rechaza término anterior al inicio y hora de término no posterior', () => {
    expect(
      errorsOf({
        permit_type: 'Horas',
        start_date: '2026-11-10',
        end_date: '2026-11-09',
        start_time: '11:00:00',
        end_time: '11:00',
        reason: 'Cita',
      }),
    ).toEqual({
      end_date: 'El término no puede ser anterior al inicio',
      end_time: 'La hora de término debe ser posterior a la de inicio',
    })
  })

  it('vacía las horas al cambiar a permiso por días', () => {
    const values = withoutHiddenValues(PERMIT_FIELDS, {
      permit_type: 'Días',
      start_time: '09:00',
      end_time: '10:00',
    })
    expect(values).toMatchObject({ start_time: null, end_time: null })
  })

  it('en la vista concentrada exige a la persona', () => {
    const result = recordSchema(PERMIT_FIELDS_WITH_EMPLOYEE).safeParse({
      permit_type: 'Días',
      start_date: '2026-11-10',
      reason: 'Cita',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['employee_id'])
  })

  it.each([
    [{ permit_type: 'Días', start_date: '2026-11-10', end_date: '2026-11-10' }, '1 día'],
    [{ permit_type: 'Días', start_date: '2026-11-30', end_date: '2026-12-02' }, '3 días'],
    [
      {
        permit_type: 'Horas',
        start_date: '2026-11-10',
        end_date: '2026-11-10',
        start_time: '09:00:00',
        end_time: '11:30:00',
      },
      '2 h 30 min',
    ],
    [
      {
        permit_type: 'Horas',
        start_date: '2026-11-10',
        end_date: '2026-11-11',
        start_time: '09:00',
        end_time: '10:00',
      },
      '1 h por día · 2 días',
    ],
  ])('calcula la duración %#', (row, expected) => {
    expect(permitDuration(row)).toBe(expected)
  })
})

describe('documentos firmados de Contratos y sedes', () => {
  const loan = SIGNED_DOCUMENTS.find((item) => item.kind === 'Préstamo')!

  it('incluye resguardo de vehículo, actas y préstamos', () => {
    expect(SIGNED_DOCUMENTS.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['Resguardo de vehículo', 'Reglamento', 'Acta administrativa', 'Préstamo']),
    )
  })

  it('exige una cantidad positiva en préstamos', () => {
    const loanSchema = recordSchema(loan.fields)
    expect(loanSchema.safeParse({ amount: null, signed_on: '2026-11-01' }).success).toBe(false)
    expect(loanSchema.safeParse({ amount: 0, signed_on: '2026-11-01' }).success).toBe(false)
    expect(loanSchema.parse({ amount: 5000, signed_on: '2026-11-01' })).toMatchObject({
      amount: 5000,
      document_url: null,
    })
  })

  it('formatea cantidad y hora para la tabla', () => {
    expect(formatMoney(5000)).toBe('$5,000.00')
    expect(formatMoney(null)).toBe('—')
    expect(formatTime('09:30:00')).toBe('09:30')
  })
})
