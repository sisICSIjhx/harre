import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkbookSnapshot } from '../../server/excel/build-workbook.js'
import { runSharepointSync, type SyncDeps } from '../../server/jobs/sharepoint-sync.job.js'
import { GraphError } from '../../server/sharepoint/graph.client.js'

const lease = { leaseToken: 'lease', jobId: 'job', attempt: 1 }
const snapshot: WorkbookSnapshot = {
  revision: 7,
  message_ids: [1, 3],
  employees: [],
  phones: [],
  emails: [],
  contacts: [],
  work_sites: [],
  addresses: [],
  education: [],
  experience: [],
  employment: [],
  contracts: [],
  confidentiality: [],
  job_profiles: [],
  projects: [],
  assignments: [],
  courses: [],
  requirements: [],
  accreditations: [],
  course_controls: [],
  documents: [],
  document_types: [],
  systems: [],
  control_numbers: [],
  bank_accounts: [],
  credits: [],
  permits: [],
}

function createDeps(overrides: Partial<SyncDeps> = {}) {
  return {
    acquireLease: vi.fn(async () => lease),
    readSnapshot: vi.fn(async () => snapshot),
    complete: vi.fn(async () => undefined),
    fail: vi.fn(async () => undefined),
    getItem: vi.fn(async () => ({ id: 'item', eTag: 'etag-1' })),
    replaceContent: vi.fn(async () => ({ id: 'item', eTag: 'etag-2' })),
    ...overrides,
  } satisfies SyncDeps
}

describe('runSharepointSync', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('no publica si no obtiene el arrendamiento', async () => {
    const deps = createDeps({ acquireLease: vi.fn(async () => null) })
    expect(await runSharepointSync(deps, 'destino')).toEqual({ status: 'idle' })
    expect(deps.replaceContent).not.toHaveBeenCalled()
  })

  it('publica con el eTag vigente y confirma solo lo cubierto', async () => {
    const deps = createDeps()
    expect(await runSharepointSync(deps, 'destino')).toEqual({ status: 'published', revision: 7 })
    expect(deps.replaceContent).toHaveBeenCalledWith(expect.any(Buffer), 'etag-1')
    expect(deps.complete).toHaveBeenCalledWith('destino', lease, snapshot, {
      id: 'item',
      eTag: 'etag-2',
    })
    expect(deps.fail).not.toHaveBeenCalled()
  })

  it('un 429 conserva el trabajo y respeta Retry-After', async () => {
    const deps = createDeps({
      replaceContent: vi.fn(async () => {
        throw new GraphError('HTTP 429', 429, true, 120)
      }),
    })
    expect(await runSharepointSync(deps, 'destino')).toEqual({ status: 'failed' })
    expect(deps.complete).not.toHaveBeenCalled()
    expect(deps.fail).toHaveBeenCalledWith('destino', lease, {
      message: 'HTTP 429',
      retryAfterSeconds: 120,
      permanent: false,
    })
  })

  it('un 403 se marca como error permanente', async () => {
    const deps = createDeps({
      getItem: vi.fn(async () => {
        throw new GraphError('HTTP 403', 403, false)
      }),
    })
    await runSharepointSync(deps, 'destino')
    expect(deps.fail).toHaveBeenCalledWith(
      'destino',
      lease,
      expect.objectContaining({ permanent: true }),
    )
  })

  it('si falla la confirmación tras publicar, lo deja recuperable', async () => {
    const deps = createDeps({
      complete: vi.fn(async () => {
        throw new Error('sin conexión')
      }),
    })
    expect(await runSharepointSync(deps, 'destino')).toEqual({ status: 'failed' })
    expect(deps.fail).toHaveBeenCalled()
  })
})
