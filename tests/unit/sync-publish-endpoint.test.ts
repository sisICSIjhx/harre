import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authorizeUser = vi.fn()
const publishNow = vi.fn()
const createPublishDeps = vi.fn(() => ({}))

vi.mock('../../server/security/authorize-user.js', () => ({ authorizeUser }))
vi.mock('../../server/jobs/sync-publish.service.js', () => ({ publishNow, createPublishDeps }))

const { default: handler } = await import('../../api/sync-publish.js')

const URL = 'https://example.test/api/sync-publish'
const post = () =>
  handler.fetch(new Request(URL, { method: 'POST', headers: { Authorization: 'Bearer t' } }))

describe('POST /api/sync-publish', () => {
  beforeEach(() => {
    vi.stubEnv('SYNC_ENABLED', 'true')
    authorizeUser.mockResolvedValue({})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('rechaza otros métodos', async () => {
    const response = await handler.fetch(new Request(URL))
    expect(response.status).toBe(405)
  })

  it('solo admite RRHH y Admin', async () => {
    authorizeUser.mockResolvedValue(null)
    const response = await post()
    expect(response.status).toBe(401)
    expect(authorizeUser).toHaveBeenCalledWith('Bearer t', ['hr', 'admin'])
    expect(publishNow).not.toHaveBeenCalled()
  })

  it('no toca la base ni Graph si SYNC_ENABLED no es "true"', async () => {
    vi.stubEnv('SYNC_ENABLED', 'false')
    const response = await post()
    expect(await response.json()).toEqual({ status: 'disabled' })
    expect(createPublishDeps).not.toHaveBeenCalled()
  })

  it('devuelve el resultado de la publicación', async () => {
    publishNow.mockResolvedValue({ status: 'up_to_date' })
    const response = await post()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'up_to_date' })
  })

  it('un fallo de publicación responde 502 sin detalle', async () => {
    publishNow.mockResolvedValue({ status: 'failed' })
    const response = await post()
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ status: 'failed' })
  })

  it('un error inesperado responde 500 sin detalle', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    publishNow.mockRejectedValue(new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY'))
    const response = await post()
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ status: 'failed' })
  })
})
