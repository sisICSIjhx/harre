import { buildWorkbook, validateWorkbook, type WorkbookSnapshot } from '../excel/build-workbook.js'
import { createFilesRepository, type DriveItemRef } from '../sharepoint/files.repository.js'
import { createGraphClient, GraphError } from '../sharepoint/graph.client.js'
import { createAdminClient } from '../supabase/admin.js'

export interface SyncLease {
  leaseToken: string
  jobId: string
  attempt: number
}

export interface SyncDeps {
  acquireLease(target: string): Promise<SyncLease | null>
  readSnapshot(target: string, lease: SyncLease): Promise<WorkbookSnapshot>
  complete(
    target: string,
    lease: SyncLease,
    snapshot: WorkbookSnapshot,
    item: DriveItemRef,
  ): Promise<void>
  fail(target: string, lease: SyncLease, failure: SyncFailure): Promise<void>
  getItem(): Promise<DriveItemRef>
  replaceContent(content: Buffer, eTag: string): Promise<DriveItemRef>
}

export interface SyncFailure {
  message: string
  retryAfterSeconds: number | null
  permanent: boolean
}

export type SyncResult =
  { status: 'idle' } | { status: 'published'; revision: number } | { status: 'failed' }

function toFailure(error: unknown): SyncFailure {
  if (error instanceof GraphError) {
    return {
      message: error.message,
      retryAfterSeconds: error.retryAfterSeconds,
      permanent: !error.transient,
    }
  }
  return {
    message: error instanceof Error ? error.message : 'Error desconocido',
    retryAfterSeconds: null,
    permanent: false,
  }
}

// Idempotente: si la publicación termina y falla la confirmación, los mensajes siguen en cola
// y la siguiente ejecución vuelve a publicar la misma información o una más reciente.
export async function runSharepointSync(deps: SyncDeps, target: string): Promise<SyncResult> {
  const lease = await deps.acquireLease(target)
  if (!lease) return { status: 'idle' }

  try {
    const snapshot = await deps.readSnapshot(target, lease)
    const workbook = await buildWorkbook(snapshot)
    await validateWorkbook(workbook, snapshot)

    const current = await deps.getItem()
    const published = await deps.replaceContent(workbook, current.eTag)

    await deps.complete(target, lease, snapshot, published)
    return { status: 'published', revision: snapshot.revision }
  } catch (error) {
    const failure = toFailure(error)
    console.error(`Sincronización fallida para ${target}: ${failure.message}`)
    try {
      await deps.fail(target, lease, failure)
    } catch (failError) {
      // El arrendamiento vence solo y el trabajo sigue recuperable.
      console.error('No se registró el fallo de sincronización', failError)
    }
    return { status: 'failed' }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

export function createSharepointSyncDeps(): SyncDeps {
  const admin = createAdminClient()
  const files = createFilesRepository(
    createGraphClient({
      tenantId: requireEnv('MS_TENANT_ID'),
      clientId: requireEnv('MS_CLIENT_ID'),
      clientSecret: requireEnv('MS_CLIENT_SECRET'),
    }),
    requireEnv('SP_DRIVE_ID'),
    requireEnv('SP_FILE_ITEM_ID'),
  )

  return {
    getItem: files.getItem,
    replaceContent: files.replaceContent,

    async acquireLease(target) {
      const { data, error } = await admin.rpc('sync_acquire_lease', { p_target: target })
      if (error) throw new Error(error.message)
      const row = data?.[0]
      return row ? { leaseToken: row.lease_token, jobId: row.job_id, attempt: row.attempt } : null
    },

    async readSnapshot(target, lease) {
      const { data, error } = await admin.rpc('sync_read_snapshot', {
        p_target: target,
        p_lease_token: lease.leaseToken,
      })
      if (error) throw new Error(error.message)
      return data as unknown as WorkbookSnapshot
    },

    async complete(target, lease, snapshot, item) {
      const { error } = await admin.rpc('sync_complete', {
        p_target: target,
        p_lease_token: lease.leaseToken,
        p_job_id: lease.jobId,
        p_revision: snapshot.revision,
        p_message_ids: snapshot.message_ids,
        p_drive_item_id: item.id,
        p_etag: item.eTag,
      })
      if (error) throw new Error(error.message)
    },

    async fail(target, lease, failure) {
      const { error } = await admin.rpc('sync_fail', {
        p_target: target,
        p_lease_token: lease.leaseToken,
        p_job_id: lease.jobId,
        p_error: failure.message,
        p_permanent: failure.permanent,
        ...(failure.retryAfterSeconds === null
          ? {}
          : { p_retry_after_seconds: failure.retryAfterSeconds }),
      })
      if (error) throw new Error(error.message)
    },
  }
}
