import { describe, expect, it } from 'vitest'
import {
  isFieldVisible,
  recordSchema,
  withoutHiddenValues,
  type RecordField,
} from '../../src/shared/lib/record-fields.js'

const fields: RecordField[] = [
  { key: 'name', label: 'Nombre', required: true },
  { key: 'phone', label: 'Teléfono' },
  { key: 'start', label: 'Inicio', type: 'date' },
  { key: 'months', label: 'Meses', type: 'number' },
  { key: 'active', label: 'Activo', type: 'boolean' },
]

describe('campo de enlace', () => {
  const schema = recordSchema([{ key: 'link', label: 'Enlace', type: 'url' }])

  it('acepta http(s) y normaliza vacío a null', () => {
    expect(schema.parse({ link: ' https://icsi.sharepoint.com/a b ' }).link).toBe(
      'https://icsi.sharepoint.com/a b',
    )
    expect(schema.parse({ link: '' }).link).toBeNull()
  })

  it.each(['javascript:alert(1)', 'ver archivo', 'file:///c:/secreto.pdf'])(
    'rechaza %s',
    (link) => {
      expect(schema.safeParse({ link }).success).toBe(false)
    },
  )
})

describe('recordSchema', () => {
  it('normaliza vacíos a null y conserva ceros iniciales', () => {
    const value = recordSchema(fields).parse({
      name: ' Curso ',
      phone: '0012',
      start: '',
      months: null,
    })
    expect(value).toEqual({
      name: 'Curso',
      phone: '0012',
      start: null,
      months: null,
      active: false,
    })
  })

  it('exige los campos obligatorios con mensaje en español', () => {
    const result = recordSchema(fields).safeParse({ name: '   ' })
    expect(result.error?.issues[0]?.message).toBe('Captura nombre')
  })

  it('rechaza una fecha mal formada', () => {
    expect(recordSchema(fields).safeParse({ name: 'x', start: '01/02/2026' }).success).toBe(false)
  })
})

describe('campos condicionales', () => {
  const contract: RecordField[] = [
    { key: 'contract_type', label: 'Contrato', type: 'select' },
    {
      key: 'contract_start_date',
      label: 'Inicio del contrato',
      type: 'date',
      visibleWhen: (values) => values.contract_type !== 'Indeterminado',
    },
  ]

  it('oculta las fechas con contrato indeterminado y las vacía al guardar', () => {
    const values = { contract_type: 'Indeterminado', contract_start_date: '2026-01-01' }
    expect(isFieldVisible(contract[1]!, values)).toBe(false)
    expect(withoutHiddenValues(contract, values)).toEqual({
      contract_type: 'Indeterminado',
      contract_start_date: null,
    })
  })

  it('conserva las fechas con otro tipo de contrato', () => {
    const values = { contract_type: 'Por meses', contract_start_date: '2026-01-01' }
    expect(isFieldVisible(contract[1]!, values)).toBe(true)
    expect(withoutHiddenValues(contract, values)).toEqual(values)
  })
})
