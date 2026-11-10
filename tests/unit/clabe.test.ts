import { describe, expect, it } from 'vitest'
import { isValidClabe } from '../../src/shared/lib/clabe.js'
import { errorMessage } from '../../src/shared/lib/record-errors.js'
import { recordSchema } from '../../src/shared/lib/record-fields.js'

// CLABE ficticias, calculadas con el algoritmo; no corresponden a cuentas reales.
describe('isValidClabe', () => {
  it('acepta una CLABE con dígito verificador correcto', () => {
    expect(isValidClabe('012180000000000015')).toBe(true)
  })

  it('acepta ceros iniciales', () => {
    expect(isValidClabe('000180000000000030')).toBe(true)
  })

  it.each(['01218000000000001', '0121800000000000150', ''])(
    'rechaza la longitud de %s',
    (clabe) => {
      expect(isValidClabe(clabe)).toBe(false)
    },
  )

  it.each(['01218000000000001A', '012 18000000000001', '012-180000000000015'])(
    'rechaza caracteres no numéricos en %s',
    (clabe) => {
      expect(isValidClabe(clabe)).toBe(false)
    },
  )

  it('rechaza un dígito verificador incorrecto', () => {
    expect(isValidClabe('012180000000000016')).toBe(false)
  })
})

describe('campo CLABE', () => {
  const schema = recordSchema([{ key: 'clabe', label: 'CLABE', type: 'clabe', required: true }])

  it('acepta una CLABE válida y conserva los ceros iniciales', () => {
    expect(schema.parse({ clabe: ' 000180000000000030 ' }).clabe).toBe('000180000000000030')
  })

  it('pide la CLABE cuando falta', () => {
    const result = schema.safeParse({ clabe: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Captura clabe')
  })

  it('explica la longitud y el dígito verificador por separado', () => {
    expect(schema.safeParse({ clabe: '0121800' }).error?.issues[0]?.message).toBe(
      'La CLABE debe tener 18 dígitos',
    )
    expect(schema.safeParse({ clabe: '012180000000000016' }).error?.issues[0]?.message).toBe(
      'La CLABE no es válida: revisa los dígitos',
    )
  })
})

describe('mensajes de error de la base', () => {
  it('reconoce la CLABE que no corresponde al banco', () => {
    expect(errorMessage({ code: '23514', hint: 'clabe_bank_mismatch' })).toBe(
      'La CLABE no corresponde al banco elegido.',
    )
  })

  it('conserva el mensaje general de las demás reglas', () => {
    expect(errorMessage({ code: '23514' })).toBe(
      'Algún dato no cumple las reglas, por ejemplo las fechas.',
    )
    expect(errorMessage({ code: '23505' })).toBe('Ya existe un registro con esos datos.')
  })
})
