import { authorizeJob } from '../../server/security/authorize-job.js'
import {
  createSharepointSyncDeps,
  runSharepointSync,
} from '../../server/jobs/sharepoint-sync.job.js'

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405)
    }
    if (!authorizeJob(request.headers.get('authorization'), process.env.SYNC_JOB_SECRET)) {
      return json({ error: 'unauthorized' }, 401)
    }
    if (process.env.SYNC_ENABLED !== 'true') {
      return json({ status: 'disabled' })
    }

    try {
      const target = process.env.SYNC_TARGET ?? 'personal-icsi'
      const result = await runSharepointSync(createSharepointSyncDeps(), target)
      return json(result, result.status === 'failed' ? 502 : 200)
    } catch (error) {
      console.error('Fallo al iniciar la sincronización', error)
      return json({ status: 'failed' }, 500)
    }
  },
}
