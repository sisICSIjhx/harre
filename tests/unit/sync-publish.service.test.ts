import { describe, expect, it, vi } from 'vitest'
import type { SyncResult } from '../../server/jobs/sharepoint-sync.job.js'
import { publishNow, type PublishState } from '../../server/jobs/sync-publish.service.js'

function deps(result: SyncResult, state: PublishState | null = null) {
  const calls: string[] = []
  return {
    calls,
    requestRetry: vi.fn(async () => {
      calls.push('retry')
    }),
    run: vi.fn(async () => {
      calls.push('run')
      return result
    }),
    readState: vi.fn(async () => state),
  }
}

describe('publishNow', () => {
  it('levanta la espera antes de publicar', async () => {
    const d = deps({ status: 'published', revision: 7 })
    expect(await publishNow(d, 'personal-icsi')).toEqual({ status: 'published', revision: 7 })
    expect(d.calls).toEqual(['retry', 'run'])
    expect(d.readState).not.toHaveBeenCalled()
  })

  it('informa el fallo sin consultar el estado', async () => {
    const d = deps({ status: 'failed' })
    expect(await publishNow(d, 'personal-icsi')).toEqual({ status: 'failed' })
    expect(d.readState).not.toHaveBeenCalled()
  })

  it('sin turno y sin cambios pendientes: al día', async () => {
    const d = deps({ status: 'idle' }, { pending_revision: 5, published_revision: 5 })
    expect(await publishNow(d, 'personal-icsi')).toEqual({ status: 'up_to_date' })
  })

  it('sin turno y con cambios pendientes: otra publicación en curso', async () => {
    const d = deps({ status: 'idle' }, { pending_revision: 6, published_revision: 5 })
    expect(await publishNow(d, 'personal-icsi')).toEqual({ status: 'in_progress' })
  })

  it('no publica si la base rechaza levantar la espera', async () => {
    const d = deps({ status: 'published', revision: 1 })
    d.requestRetry.mockRejectedValueOnce(new Error('No autorizado'))
    await expect(publishNow(d, 'personal-icsi')).rejects.toThrow('No autorizado')
    expect(d.run).not.toHaveBeenCalled()
  })
})
