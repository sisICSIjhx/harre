import { supabase } from '@/shared/lib/supabase'

export async function getSyncState() {
  const { data, error } = await supabase
    .from('sync_state')
    .select(
      'target, pending_revision, published_revision, lease_expires_at, attempts, next_attempt_at, last_success_at, last_error',
    )
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listRecentSyncJobs() {
  const { data, error } = await supabase
    .from('sync_jobs')
    .select('id, status, attempt, revision, error_summary, started_at, finished_at')
    .order('started_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

export async function requestSyncRetry(target: string) {
  const { error } = await supabase.rpc('sync_request_retry', { p_target: target })
  if (error) throw error
}
