import { describe, expect, it } from 'vitest'
import { ageInYears } from '../../src/shared/utils/age.js'

describe('edad por fecha civil', () => {
  it('cambia en el cumpleaños, sin desplazamiento de zona horaria', () => {
    expect(ageInYears('2000-11-04', new Date(2026, 10, 3))).toBe(25)
    expect(ageInYears('2000-11-04', new Date(2026, 10, 4))).toBe(26)
  })
  it('cumple años el 1 de marzo en años no bisiestos para nacidos el 29 de febrero', () => {
    expect(ageInYears('2000-02-29', new Date(2025, 1, 28))).toBe(24)
    expect(ageInYears('2000-02-29', new Date(2025, 2, 1))).toBe(25)
  })
  it.each([null, undefined, '', '2024-02-30', '2027-01-01'])('no inventa edad para %s', (value) => {
    expect(ageInYears(value, new Date(2026, 10, 3))).toBeNull()
  })
})
