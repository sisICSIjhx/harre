import { GraphError, type GraphClient } from './graph.client.js'

export interface DriveItemRef {
  id: string
  eTag: string
}

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function itemPath(driveId: string, itemId: string): string {
  return `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`
}

export function createFilesRepository(graph: GraphClient, driveId: string, itemId: string) {
  return {
    async getItem(): Promise<DriveItemRef> {
      const response = await graph.request(`${itemPath(driveId, itemId)}?$select=id,eTag`)
      return (await response.json()) as DriveItemRef
    },

    // Reemplaza el contenido sobre el mismo driveItem para conservar su identidad.
    async replaceContent(content: Buffer, eTag: string): Promise<DriveItemRef> {
      const response = await graph.request(`${itemPath(driveId, itemId)}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': XLSX_MIME_TYPE, 'If-Match': eTag },
        body: new Uint8Array(content),
      })
      const item = (await response.json()) as DriveItemRef
      if (item.id !== itemId || !item.eTag) {
        throw new GraphError('Respuesta de publicación inesperada', response.status, false)
      }
      return item
    },
  }
}

export type FilesRepository = ReturnType<typeof createFilesRepository>
