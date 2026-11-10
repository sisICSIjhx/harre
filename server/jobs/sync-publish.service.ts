import type { UserClient } from '../supabase/user.js'
import { createAdminClient } from '../supabase/admin.js'
import {
  createSharepointSyncDeps,
  runSharepointSync,
  type SyncResult,
} from './sharepoint-sync.job.js'

export type PublishResult =
  | { status: 'published'; revision: number }
  | { status: 'up_to_date' }
  | { status: 'in_progress' }
  | { status: 'failed' }

export interface PublishState {
  pending_revision: number
  published_revision: number
}

export interface PublishDeps {
  requestRetry(target: string): Promise<void>
  run(target: string): Promise<SyncResult>
  readState(target: string): Promise<PublishState | null>
}

// Publicación pedida por una persona: levanta la espera de reintento y publica en el momento.
// El arrendamiento sigue impidiendo dos publicaciones simultáneas.
export async function publishNow(deps: PublishDeps, target: string): Promise<PublishResult> {
  await deps.requestRetry(target)
  const result = await deps.run(target)
  if (result.status !== 'idle') return result

  // Sin turno: o no hay cambios, u otra ejecución lo tiene.
  const state = await deps.readState(target)
  if (!state || state.pending_revision <= state.published_revision) return { status: 'up_to_date' }
  return { status: 'in_progress' }
}

export function createPublishDeps(userClient: UserClient): PublishDeps {
  const admin = createAdminClient()
  return {
    async requestRetry(target) {
      // Con la sesión de quien pide: la base vuelve a comprobar el rol.
      const { error } = await userClient.rpc('sync_request_retry', { p_target: target })
      if (error) throw new Error(error.message)
    },
    run: (target) => runSharepointSync(createSharepointSyncDeps(), target),
    async readState(target) {
      const { data, error } = await admin
        .from('sync_state')
        .select('pending_revision, published_revision')
        .eq('target', target)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data
    },
  }
}
