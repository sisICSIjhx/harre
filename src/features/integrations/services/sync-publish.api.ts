import { supabase } from '@/shared/lib/supabase'

export type PublishStatus = 'published' | 'up_to_date' | 'in_progress' | 'disabled' | 'failed'

// La ruta usa la sesión de quien pide; el secreto del trabajo programado nunca llega al navegador.
export async function publishSyncNow(): Promise<PublishStatus> {
  const { data } = await supabase.auth.getSession()
  const response = await fetch('/api/sync-publish', {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
  })
  const body = (await response.json().catch(() => null)) as { status?: PublishStatus } | null
  if (body?.status) return body.status
  throw new Error(`Publicar ahora: HTTP ${response.status}`)
}
