import { z } from 'zod'
import {
  ALLOWED_FILE_TYPES,
  createEmployeeFilesDeps,
  ensureFolder,
  FileRequestError,
  finishUpload,
  getFileUrl,
  MAX_FILE_BYTES,
  startUpload,
} from '../server/files/employee-files.service.js'
import { authorizeHrUser } from '../server/security/authorize-user.js'

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ensure-folder'), employeeId: z.uuid() }),
  z.object({
    action: z.literal('start-upload'),
    employeeId: z.uuid(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(ALLOWED_FILE_TYPES),
    size: z.number().int().positive().max(MAX_FILE_BYTES),
  }),
  z.object({
    action: z.literal('finish-upload'),
    employeeId: z.uuid(),
    documentType: z.string().trim().min(1).max(200),
    itemId: z.string().min(1).max(200),
  }),
  z.object({ action: z.literal('file-url'), documentId: z.uuid() }),
])

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405)
    }

    try {
      const client = await authorizeHrUser(request.headers.get('authorization'))
      if (!client) return json({ error: 'unauthorized' }, 401)

      const parsed = requestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) return json({ error: 'invalid_request' }, 400)

      const body = parsed.data
      const deps = createEmployeeFilesDeps(client)
      switch (body.action) {
        case 'ensure-folder':
          await ensureFolder(deps, body.employeeId)
          return json({ status: 'ok' })
        case 'start-upload':
          return json(await startUpload(deps, body.employeeId, body.fileName))
        case 'finish-upload':
          await finishUpload(deps, body.employeeId, body.documentType, body.itemId)
          return json({ status: 'ok' })
        case 'file-url':
          return json({ url: await getFileUrl(deps, body.documentId) })
      }
    } catch (error) {
      if (error instanceof FileRequestError) return json({ error: error.code }, error.status)
      console.error('Fallo en archivos del expediente', error)
      return json({ error: 'failed' }, 502)
    }
  },
}
