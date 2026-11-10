import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/jobs/sync-sharepoint.js'

const URL = 'https://example.test/api/jobs/sync-sharepoint'

describe('POST /api/jobs/sync-sharepoint', () => {
  beforeEach(() => {
    vi.stubEnv('SYNC_JOB_SECRET', 'secreto')
    vi.stubEnv('SYNC_ENABLED', 'false')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('rechaza otros métodos', async () => {
    const response = await handler.fetch(new Request(URL))
    expect(response.status).toBe(405)
  })

  it('rechaza peticiones sin credencial', async () => {
    const response = await handler.fetch(new Request(URL, { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('no ejecuta nada si SYNC_ENABLED no es "true"', async () => {
    const response = await handler.fetch(
      new Request(URL, { method: 'POST', headers: { Authorization: 'Bearer secreto' } }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'disabled' })
  })
})
