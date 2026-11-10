import type { DriveFile, DriveFolder } from '../sharepoint/employee-files.repository.js'
import { createEmployeeFilesRepository } from '../sharepoint/employee-files.repository.js'
import { createGraphClient } from '../sharepoint/graph.client.js'
import type { UserClient } from '../supabase/user.js'

// Mismas reglas que el bucket de Supabase Storage.
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_FILE_BYTES = 10 * 1024 * 1024

const UNIQUE_VIOLATION = '23505'
const MAX_NAME_ATTEMPTS = 50
const NAME_PARTICLES = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y'])

export class FileRequestError extends Error {
  constructor(
    readonly code: 'not_found' | 'invalid_file' | 'not_configured',
    readonly status: number,
  ) {
    super(code)
    this.name = 'FileRequestError'
  }
}

export interface EmployeeNames {
  first_name: string
  last_name: string | null
  second_last_name: string | null
}

export interface EmployeeFolder {
  item_id: string
  folder_name: string
  web_url: string | null
}

export interface NewDocument {
  employeeId: string
  documentType: string
  file: DriveFile
}

export interface EmployeeFilesStore {
  getEmployeeNames(employeeId: string): Promise<EmployeeNames | null>
  getFolder(employeeId: string): Promise<EmployeeFolder | null>
  // false si otro registro ya usa la persona o el nombre de carpeta.
  insertFolder(employeeId: string, folder: EmployeeFolder): Promise<boolean>
  // false si el archivo ya estaba registrado.
  insertDocument(document: NewDocument): Promise<boolean>
  getDocumentItemId(documentId: string): Promise<string | null>
}

export interface EmployeeFilesDrive {
  createFolder(name: string): Promise<DriveFolder | null>
  createUploadSession(folderId: string, fileName: string): Promise<string>
  getFile(itemId: string): Promise<DriveFile>
  deleteItem(itemId: string): Promise<void>
}

export interface EmployeeFilesDeps {
  store: EmployeeFilesStore
  drive: EmployeeFilesDrive
}

function withoutAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// RICARDO MOLINA VILLAGRÁN → RMV_EXPEDIENTE. Las partículas no cuentan: DE LA CRUZ aporta la C.
export function expedienteFolderName(names: EmployeeNames): string {
  const initials = [names.first_name, names.last_name, names.second_last_name]
    .flatMap((part) =>
      withoutAccents(part ?? '')
        .toUpperCase()
        .split(/[^A-Z]+/),
    )
    .filter((word) => word && !NAME_PARTICLES.has(word))
    .map((word) => word[0])
    .join('')
  return `${initials || 'SN'}_EXPEDIENTE`
}

// Dos personas pueden tener las mismas iniciales: la segunda queda como RMV_EXPEDIENTE_2.
function candidateName(base: string, attempt: number): string {
  return attempt === 1 ? base : `${base}_${attempt}`
}

export function safeFileName(name: string): string {
  const clean = withoutAccents(name)
    .replace(/[^\w.-]+/g, '_')
    .replace(/^[._]+/, '')
  return clean || 'archivo'
}

export async function ensureFolder(
  { store, drive }: EmployeeFilesDeps,
  employeeId: string,
): Promise<EmployeeFolder> {
  const existing = await store.getFolder(employeeId)
  if (existing) return existing

  const names = await store.getEmployeeNames(employeeId)
  if (!names) throw new FileRequestError('not_found', 404)
  const base = expedienteFolderName(names)

  for (let attempt = 1; attempt <= MAX_NAME_ATTEMPTS; attempt += 1) {
    const name = candidateName(base, attempt)
    const created = await drive.createFolder(name)
    if (!created) continue

    const folder = { item_id: created.id, folder_name: name, web_url: created.webUrl }
    if (await store.insertFolder(employeeId, folder)) return folder

    // Otra petición ganó, o el nombre quedó registrado para una carpeta borrada en SharePoint.
    await drive.deleteItem(created.id)
    const winner = await store.getFolder(employeeId)
    if (winner) return winner
  }
  throw new Error('No se encontró un nombre de carpeta disponible')
}

export async function startUpload(deps: EmployeeFilesDeps, employeeId: string, fileName: string) {
  const folder = await ensureFolder(deps, employeeId)
  return { uploadUrl: await deps.drive.createUploadSession(folder.item_id, safeFileName(fileName)) }
}

// Lo que se registra sale de SharePoint, no de lo que el navegador declara sobre el archivo.
export async function finishUpload(
  deps: EmployeeFilesDeps,
  employeeId: string,
  documentType: string,
  itemId: string,
): Promise<void> {
  const folder = await ensureFolder(deps, employeeId)
  const file = await deps.drive.getFile(itemId)
  if (file.parentId !== folder.item_id) throw new FileRequestError('invalid_file', 422)

  const allowed =
    !!file.mimeType && ALLOWED_FILE_TYPES.includes(file.mimeType) && file.size <= MAX_FILE_BYTES
  if (!allowed) {
    await deps.drive.deleteItem(itemId)
    throw new FileRequestError('invalid_file', 422)
  }

  try {
    await deps.store.insertDocument({ employeeId, documentType, file })
  } catch (error) {
    // Sin registro, el archivo quedaría huérfano.
    await deps.drive.deleteItem(itemId)
    throw error
  }
}

export async function getFileUrl(deps: EmployeeFilesDeps, documentId: string): Promise<string> {
  const itemId = await deps.store.getDocumentItemId(documentId)
  if (!itemId) throw new FileRequestError('not_found', 404)
  const { downloadUrl } = await deps.drive.getFile(itemId)
  if (!downloadUrl) throw new FileRequestError('not_found', 404)
  return downloadUrl
}

function createEmployeeFilesStore(client: UserClient): EmployeeFilesStore {
  return {
    async getEmployeeNames(employeeId) {
      const { data, error } = await client
        .from('employees')
        .select('first_name, last_name, second_last_name')
        .eq('id', employeeId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async getFolder(employeeId) {
      const { data, error } = await client
        .from('employee_sharepoint_folders')
        .select('item_id, folder_name, web_url')
        .eq('employee_id', employeeId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async insertFolder(employeeId, folder) {
      const { error } = await client
        .from('employee_sharepoint_folders')
        .insert({ employee_id: employeeId, ...folder })
      if (error?.code === UNIQUE_VIOLATION) return false
      if (error) throw error
      return true
    },

    async insertDocument({ employeeId, documentType, file }) {
      const { error } = await client.from('employee_documents').insert({
        employee_id: employeeId,
        document_type: documentType,
        bucket: null,
        storage_path: null,
        sharepoint_item_id: file.id,
        web_url: file.webUrl,
        original_filename: file.name,
        mime_type: file.mimeType,
        size_bytes: file.size,
      })
      // Reintento de la misma subida: el archivo ya está registrado y no debe borrarse.
      if (error?.code === UNIQUE_VIOLATION) return false
      if (error) throw error
      return true
    },

    async getDocumentItemId(documentId) {
      const { data, error } = await client
        .from('employee_documents')
        .select('sharepoint_item_id')
        .eq('id', documentId)
        .maybeSingle()
      if (error) throw error
      return data?.sharepoint_item_id ?? null
    },
  }
}

export function createEmployeeFilesDeps(client: UserClient): EmployeeFilesDeps {
  const env = process.env
  const { MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, SP_DRIVE_ID, SP_EMPLOYEES_FOLDER_ID } = env
  if (
    !MS_TENANT_ID ||
    !MS_CLIENT_ID ||
    !MS_CLIENT_SECRET ||
    !SP_DRIVE_ID ||
    !SP_EMPLOYEES_FOLDER_ID
  ) {
    throw new FileRequestError('not_configured', 503)
  }
  const graph = createGraphClient({
    tenantId: MS_TENANT_ID,
    clientId: MS_CLIENT_ID,
    clientSecret: MS_CLIENT_SECRET,
  })
  return {
    store: createEmployeeFilesStore(client),
    drive: createEmployeeFilesRepository(graph, SP_DRIVE_ID, SP_EMPLOYEES_FOLDER_ID),
  }
}
