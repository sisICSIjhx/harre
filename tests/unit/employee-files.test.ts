import { describe, expect, it, vi } from 'vitest'
import handler from '../../api/employee-files.js'
import {
  ensureFolder,
  expedienteFolderName,
  FileRequestError,
  finishUpload,
  getFileUrl,
  safeFileName,
  startUpload,
  type EmployeeFilesDeps,
  type EmployeeFolder,
} from '../../server/files/employee-files.service.js'
import {
  createEmployeeFilesRepository,
  type DriveFile,
  type DriveFolder,
} from '../../server/sharepoint/employee-files.repository.js'
import { GraphError, type GraphClient } from '../../server/sharepoint/graph.client.js'

const EMPLOYEE = 'empleado-1'
const FOLDER: EmployeeFolder = { item_id: 'carpeta-1', folder_name: 'AB_EXPEDIENTE', web_url: null }

function makeFile(overrides: Partial<DriveFile> = {}): DriveFile {
  return {
    id: 'archivo-1',
    name: 'constancia.pdf',
    size: 1000,
    webUrl: 'https://sp.example.test/constancia.pdf',
    mimeType: 'application/pdf',
    parentId: FOLDER.item_id,
    downloadUrl: 'https://sp.example.test/descarga',
    ...overrides,
  }
}

function makeDeps(folder: EmployeeFolder | null = FOLDER) {
  return {
    store: {
      getEmployeeNames: vi.fn(async () => ({
        first_name: 'Ana',
        last_name: 'Bravo',
        second_last_name: null,
      })),
      getFolder: vi.fn(async () => folder),
      insertFolder: vi.fn(async () => true),
      insertDocument: vi.fn(async () => true),
      getDocumentItemId: vi.fn(async (): Promise<string | null> => 'archivo-1'),
    },
    drive: {
      createFolder: vi.fn<(name: string) => Promise<DriveFolder | null>>(async () => ({
        id: 'nueva',
        webUrl: null,
      })),
      createUploadSession: vi.fn(async () => 'https://sp.example.test/sesion'),
      getFile: vi.fn(async () => makeFile()),
      deleteItem: vi.fn(async () => undefined),
    },
  } satisfies EmployeeFilesDeps
}

describe('expedienteFolderName', () => {
  it.each<[string, string | null, string | null, string]>([
    ['Ricardo', 'Molina', 'Villagrán', 'RMV_EXPEDIENTE'],
    ['Jorge Alberto', 'Linares', 'Gutierrez', 'JALG_EXPEDIENTE'],
    ['Gabriel', 'de la Cruz', 'Sagrero', 'GCS_EXPEDIENTE'],
    ['Ángel', 'Núñez', null, 'AN_EXPEDIENTE'],
    ['', null, null, 'SN_EXPEDIENTE'],
  ])('%s %s %s → %s', (first_name, last_name, second_last_name, expected) => {
    expect(expedienteFolderName({ first_name, last_name, second_last_name })).toBe(expected)
  })
})

describe('safeFileName', () => {
  it('quita acentos, rutas y caracteres no válidos en SharePoint', () => {
    expect(safeFileName('Constancia Situación #1.pdf')).toBe('Constancia_Situacion_1.pdf')
    expect(safeFileName('../../secreto.pdf')).toBe('secreto.pdf')
    expect(safeFileName('###')).toBe('archivo')
  })
})

describe('ensureFolder', () => {
  it('reutiliza la carpeta ya registrada sin llamar a SharePoint', async () => {
    const deps = makeDeps()
    expect(await ensureFolder(deps, EMPLOYEE)).toEqual(FOLDER)
    expect(deps.drive.createFolder).not.toHaveBeenCalled()
  })

  it('agrega un sufijo si las iniciales ya tienen carpeta', async () => {
    const deps = makeDeps(null)
    deps.drive.createFolder.mockResolvedValueOnce(null)
    const folder = await ensureFolder(deps, EMPLOYEE)
    expect(deps.drive.createFolder.mock.calls.map(([name]) => name)).toEqual([
      'AB_EXPEDIENTE',
      'AB_EXPEDIENTE_2',
    ])
    expect(folder.folder_name).toBe('AB_EXPEDIENTE_2')
  })

  it('usa la carpeta de la petición concurrente y borra la propia', async () => {
    const deps = makeDeps(null)
    deps.store.insertFolder.mockResolvedValueOnce(false)
    deps.store.getFolder.mockResolvedValueOnce(null).mockResolvedValueOnce(FOLDER)
    expect(await ensureFolder(deps, EMPLOYEE)).toEqual(FOLDER)
    expect(deps.drive.deleteItem).toHaveBeenCalledWith('nueva')
  })

  it('rechaza a una persona inexistente o sin acceso por RLS', async () => {
    const deps = makeDeps(null)
    deps.store.getEmployeeNames.mockResolvedValueOnce(null as never)
    await expect(ensureFolder(deps, EMPLOYEE)).rejects.toBeInstanceOf(FileRequestError)
    expect(deps.drive.createFolder).not.toHaveBeenCalled()
  })
})

describe('subida', () => {
  it('abre la sesión dentro de la carpeta de la persona', async () => {
    const deps = makeDeps()
    const result = await startUpload(deps, EMPLOYEE, 'Mi archivo.pdf')
    expect(deps.drive.createUploadSession).toHaveBeenCalledWith('carpeta-1', 'Mi_archivo.pdf')
    expect(result.uploadUrl).toBe('https://sp.example.test/sesion')
  })

  it('registra el archivo con los datos que reporta SharePoint', async () => {
    const deps = makeDeps()
    await finishUpload(deps, EMPLOYEE, 'Constancia', 'archivo-1')
    expect(deps.store.insertDocument).toHaveBeenCalledWith({
      employeeId: EMPLOYEE,
      documentType: 'Constancia',
      file: makeFile(),
    })
  })

  it('no toca un archivo de otra carpeta', async () => {
    const deps = makeDeps()
    deps.drive.getFile.mockResolvedValueOnce(makeFile({ parentId: 'otra' }))
    await expect(finishUpload(deps, EMPLOYEE, 'X', 'archivo-1')).rejects.toThrow('invalid_file')
    expect(deps.drive.deleteItem).not.toHaveBeenCalled()
    expect(deps.store.insertDocument).not.toHaveBeenCalled()
  })

  it.each([
    ['tipo', { mimeType: 'application/x-msdownload' }],
    ['tamaño', { size: 10 * 1024 * 1024 + 1 }],
  ])('borra el archivo subido con %s no permitido', async (_name, overrides) => {
    const deps = makeDeps()
    deps.drive.getFile.mockResolvedValueOnce(makeFile(overrides))
    await expect(finishUpload(deps, EMPLOYEE, 'X', 'archivo-1')).rejects.toThrow('invalid_file')
    expect(deps.drive.deleteItem).toHaveBeenCalledWith('archivo-1')
  })

  it('no deja huérfano el archivo si falla el registro', async () => {
    const deps = makeDeps()
    deps.store.insertDocument.mockRejectedValueOnce(new Error('fallo'))
    await expect(finishUpload(deps, EMPLOYEE, 'X', 'archivo-1')).rejects.toThrow('fallo')
    expect(deps.drive.deleteItem).toHaveBeenCalledWith('archivo-1')
  })

  it('un reintento de la misma subida no borra el archivo ya registrado', async () => {
    const deps = makeDeps()
    deps.store.insertDocument.mockResolvedValueOnce(false)
    await finishUpload(deps, EMPLOYEE, 'X', 'archivo-1')
    expect(deps.drive.deleteItem).not.toHaveBeenCalled()
  })
})

describe('getFileUrl', () => {
  it('rechaza un archivo que no está en SharePoint', async () => {
    const deps = makeDeps()
    deps.store.getDocumentItemId.mockResolvedValueOnce(null)
    await expect(getFileUrl(deps, 'doc')).rejects.toThrow('not_found')
  })
})

describe('createEmployeeFilesRepository', () => {
  it('no reutiliza una carpeta existente: 409 se informa como nombre ocupado', async () => {
    const request = vi.fn(async () => {
      throw new GraphError('Microsoft Graph respondió HTTP 409', 409, false)
    })
    const repository = createEmployeeFilesRepository({ request }, 'drive', 'raiz')
    expect(await repository.createFolder('AB_EXPEDIENTE')).toBeNull()
  })

  it('propaga cualquier otro error de Graph', async () => {
    const request = vi.fn(async () => {
      throw new GraphError('Microsoft Graph respondió HTTP 403', 403, false)
    })
    const repository = createEmployeeFilesRepository({ request }, 'drive', 'raiz')
    await expect(repository.createFolder('AB_EXPEDIENTE')).rejects.toBeInstanceOf(GraphError)
  })

  it('abre la sesión de subida bajo la carpeta y codifica el nombre', async () => {
    const request = vi.fn<GraphClient['request']>(async () =>
      Response.json({ uploadUrl: 'https://sp.example.test/sesion' }),
    )
    const repository = createEmployeeFilesRepository({ request }, 'drive', 'raiz')
    await repository.createUploadSession('carpeta', 'a b.pdf')
    expect(request.mock.calls[0]?.[0]).toBe(
      '/drives/drive/items/carpeta:/a%20b.pdf:/createUploadSession',
    )
  })
})

describe('POST /api/employee-files', () => {
  const URL = 'https://example.test/api/employee-files'

  it('rechaza otros métodos', async () => {
    expect((await handler.fetch(new Request(URL))).status).toBe(405)
  })

  it('rechaza peticiones sin sesión', async () => {
    const response = await handler.fetch(new Request(URL, { method: 'POST' }))
    expect(response.status).toBe(401)
  })
})
