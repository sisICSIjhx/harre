import { describe, expect, it } from 'vitest'
import { initials } from '../../src/shared/utils/format.js'

describe('initials', () => {
  it('toma la primera letra de las dos primeras palabras', () => {
    expect(initials('Empleada Ficticia Dos')).toBe('EF')
    expect(initials('  ángel   prueba ')).toBe('ÁP')
  })

  it('tolera nombres de una palabra o vacíos', () => {
    expect(initials('Persona')).toBe('P')
    expect(initials(null)).toBe('')
  })
})
