import { describe, expect, it } from 'vitest'
import { authorizeJob } from '../../server/security/authorize-job.js'

describe('authorizeJob', () => {
  it('acepta solo el secreto exacto', () => {
    expect(authorizeJob('Bearer correcto', 'correcto')).toBe(true)
    expect(authorizeJob('Bearer incorrecto', 'correcto')).toBe(false)
    expect(authorizeJob('correcto', 'correcto')).toBe(false)
  })

  it('rechaza si falta el encabezado o el secreto configurado', () => {
    expect(authorizeJob(null, 'correcto')).toBe(false)
    expect(authorizeJob('Bearer ', '')).toBe(false)
    expect(authorizeJob('Bearer undefined', undefined)).toBe(false)
  })
})
