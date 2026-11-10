import { supabase } from '@/shared/lib/supabase'

// Se activa al quedar listo el sitio de SharePoint; mientras tanto se usa Supabase Storage.
export const filesInSharePoint = import.meta.env.VITE_EMPLOYEE_FILES_TARGET === 'sharepoint'

async function callFilesApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const response = await fetch('/api/employee-files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Archivos del expediente: HTTP ${response.status}`)
  return (await response.json()) as T
}

export async function ensureEmployeeFolder(employeeId: string): Promise<void> {
  await callFilesApi({ action: 'ensure-folder', employeeId })
}

export async function uploadToSharePoint(employeeId: string, documentType: string, file: File) {
  const { uploadUrl } = await callFilesApi<{ uploadUrl: string }>({
    action: 'start-upload',
    employeeId,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  })

  // Los 10 MB permitidos caben en un solo fragmento. Esta URL no lleva la sesión del usuario.
  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Range': `bytes 0-${file.size - 1}/${file.size}` },
    body: file,
  })
  if (!upload.ok) throw new Error(`SharePoint: HTTP ${upload.status}`)
  const item = (await upload.json()) as { id: string }

  await callFilesApi({ action: 'finish-upload', employeeId, documentType, itemId: item.id })
}

export async function getSharePointFileUrl(documentId: string): Promise<string> {
  const { url } = await callFilesApi<{ url: string }>({ action: 'file-url', documentId })
  return url
}
