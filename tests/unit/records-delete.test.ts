import { beforeEach, describe, expect, it, vi } from 'vitest'

const { query } = vi.hoisted(() => ({
  query: { from: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn() },
}))
vi.mock('../../src/shared/lib/supabase', () => ({ supabase: query }))
import { deleteRecord } from '../../src/shared/lib/records.js'

describe('eliminación de registros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.from.mockReturnValue(query)
    query.delete.mockReturnValue(query)
    query.eq.mockReturnValue(query)
  })

  it('elimina solo el registro seleccionado', async () => {
    query.select.mockResolvedValue({ data: [{ id: 'puesto-de-prueba' }], error: null })
    await deleteRecord('employee_assignments', { id: 'puesto-de-prueba' })
    expect(query.from).toHaveBeenCalledWith('employee_assignments')
    expect(query.eq).toHaveBeenCalledWith('id', 'puesto-de-prueba')
  })

  it('no anuncia éxito si RLS oculta el registro o ya se eliminó', async () => {
    query.select.mockResolvedValue({ data: [], error: null })
    await expect(deleteRecord('employee_assignments', { id: 'puesto-de-prueba' })).rejects.toThrow(
      'El registro ya no existe o no tienes permiso para eliminarlo.',
    )
  })

  it('conserva el error de permisos del servidor', async () => {
    query.select.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } })
    await expect(deleteRecord('employee_assignments', { id: 'puesto-de-prueba' })).rejects.toThrow(
      'No tienes permiso para esta operación.',
    )
  })
})
