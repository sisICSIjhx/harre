import { describe, expect, it } from 'vitest'
import { EXPIRING_DOCUMENTS } from '../../src/features/employees/schemas/expiring-document.fields.js'
import { recordSchema } from '../../src/shared/lib/record-fields.js'

describe('captura de documentos con vigencia', () => {
  it('separa los identificadores de INE y licencia y conserva ceros iniciales', () => {
    const ine = recordSchema(EXPIRING_DOCUMENTS[0].fields).parse({
      ine_elector_key: ' CLAVE-FICTICIA ',
      ine_cic: '0000123',
      ine_ocr: '0000456',
      license_number: 'NO-DEBE-ENVIARSE',
      review_status: 'Sin revisar',
      manual_decision: 'Requerido',
    })
    expect(ine).toMatchObject({
      ine_elector_key: 'CLAVE-FICTICIA',
      ine_cic: '0000123',
      ine_ocr: '0000456',
    })
    expect(ine).not.toHaveProperty('license_number')
    const license = recordSchema(EXPIRING_DOCUMENTS[1].fields).parse({
      license_number: '0000789',
      license_type: 'Tipo de prueba',
      license_state: 'Estado de prueba',
      license_restrictions: ' Usar lentes ',
      license_organ_donor: 'Sí',
      ine_elector_key: 'NO-DEBE-ENVIARSE',
      review_status: 'Recibido',
      manual_decision: 'Requerido',
    })
    expect(license.license_number).toBe('0000789')
    expect(license).toMatchObject({
      license_restrictions: 'Usar lentes',
      license_organ_donor: 'Sí',
    })
    expect(ine).not.toHaveProperty('license_restrictions')
    expect(license).not.toHaveProperty('ine_elector_key')
  })

  it.each(EXPIRING_DOCUMENTS)('valida fechas y enlaces de $title', ({ fields }) => {
    const schema = recordSchema(fields)
    const base = { review_status: 'Sin revisar', manual_decision: 'Requerido' }
    expect(schema.safeParse({ ...base, issued_on: '2026-02-30' }).success).toBe(false)
    expect(schema.safeParse({ ...base, document_url: 'javascript:alert(1)' }).success).toBe(false)
    expect(
      schema.parse({ ...base, issued_on: '2026-01-01', expires_on: '2030-12-31' }),
    ).toMatchObject({
      issued_on: '2026-01-01',
      expires_on: '2030-12-31',
    })
  })

  it.each(EXPIRING_DOCUMENTS)('$title envía si el registro es vigente', ({ fields }) => {
    const schema = recordSchema(fields)
    const base = { review_status: 'Sin revisar', manual_decision: 'Requerido' }
    expect(fields.find((field) => field.key === 'is_current')).toMatchObject({
      type: 'boolean',
      initial: true,
    })
    expect(schema.parse({ ...base, is_current: false })).toMatchObject({ is_current: false })
  })
})
