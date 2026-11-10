import { createPublishDeps, publishNow } from '../server/jobs/sync-publish.service.js'
import { authorizeUser } from '../server/security/authorize-user.js'

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Publicación bajo demanda desde la pantalla Sincronización. Usa la sesión de quien la pide,
// nunca SYNC_JOB_SECRET; el detalle de un fallo queda en sync_state, no en la respuesta.
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405)
    }

    try {
      const client = await authorizeUser(request.headers.get('authorization'), ['hr', 'admin'])
      if (!client) return json({ error: 'unauthorized' }, 401)

      if (process.env.SYNC_ENABLED !== 'true') {
        return json({ status: 'disabled' })
      }

      const target = process.env.SYNC_TARGET ?? 'personal-icsi'
      const result = await publishNow(createPublishDeps(client), target)
      return json(result, result.status === 'failed' ? 502 : 200)
    } catch (error) {
      console.error('Fallo en la publicación bajo demanda', error)
      return json({ status: 'failed' }, 500)
    }
  },
}
