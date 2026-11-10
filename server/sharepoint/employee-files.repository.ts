import { GraphError, type GraphClient } from './graph.client.js'

export interface DriveFolder {
  id: string
  webUrl: string | null
}

export interface DriveFile {
  id: string
  name: string
  size: number
  webUrl: string | null
  mimeType: string | null
  parentId: string | null
  downloadUrl: string | null
}

export function createEmployeeFilesRepository(
  graph: GraphClient,
  driveId: string,
  parentFolderId: string,
) {
  const drive = `/drives/${encodeURIComponent(driveId)}`
  const item = (id: string) => `${drive}/items/${encodeURIComponent(id)}`
  const postJson = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    // null si ya existe una carpeta con ese nombre: nunca se reutiliza, podría ser de otra persona.
    async createFolder(name: string): Promise<DriveFolder | null> {
      try {
        const response = await graph.request(
          `${item(parentFolderId)}/children`,
          postJson({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
        )
        const folder = (await response.json()) as { id: string; webUrl?: string }
        return { id: folder.id, webUrl: folder.webUrl ?? null }
      } catch (error) {
        if (error instanceof GraphError && error.status === 409) return null
        throw error
      }
    },

    // La URL ya viene autorizada: el navegador sube directo, sin el límite de cuerpo de Vercel.
    async createUploadSession(folderId: string, fileName: string): Promise<string> {
      const response = await graph.request(
        `${item(folderId)}:/${encodeURIComponent(fileName)}:/createUploadSession`,
        postJson({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
      )
      return ((await response.json()) as { uploadUrl: string }).uploadUrl
    },

    async getFile(itemId: string): Promise<DriveFile> {
      const response = await graph.request(item(itemId))
      const file = (await response.json()) as {
        id: string
        name: string
        size: number
        webUrl?: string
        file?: { mimeType?: string }
        parentReference?: { id?: string }
        '@microsoft.graph.downloadUrl'?: string
      }
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        webUrl: file.webUrl ?? null,
        mimeType: file.file?.mimeType ?? null,
        parentId: file.parentReference?.id ?? null,
        downloadUrl: file['@microsoft.graph.downloadUrl'] ?? null,
      }
    },

    async deleteItem(itemId: string): Promise<void> {
      await graph.request(item(itemId), { method: 'DELETE' })
    },
  }
}

export type EmployeeFilesRepository = ReturnType<typeof createEmployeeFilesRepository>
