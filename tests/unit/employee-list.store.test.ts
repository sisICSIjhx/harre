import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'

describe('useEmployeeListStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('inicia con personal activo y sin la columna de proyecto', () => {
    const list = useEmployeeListStore()
    expect(list.filters.statuses).toEqual(['active'])
    expect(list.activeFilterCount).toBe(1)
    expect(list.columns).toEqual(['job_profile_name', 'site', 'hire_date', 'termination_date'])
  })

  it('filtrar por un dato muestra su columna', () => {
    const list = useEmployeeListStore()
    list.setFilter('project_name', 'projects', ['Santa Ana'])
    expect(list.columns).toContain('project_name')
    expect(list.activeFilterCount).toBe(2)
  })

  it('quitar la columna quita sus filtros, para no filtrar por algo que no se ve', () => {
    const list = useEmployeeListStore()
    list.setFilter('hire_date', 'hireFrom', '2024-01-01')
    list.setFilter('hire_date', 'hireTo', '2024-12-31')
    list.toggleColumn('hire_date', false)
    expect(list.columns).not.toContain('hire_date')
    expect(list.filters.hireFrom).toBeNull()
    expect(list.filters.hireTo).toBeNull()
  })

  it('restablecer vuelve a los valores iniciales', () => {
    const list = useEmployeeListStore()
    list.setFilter('site', 'sites', ['Tula'])
    list.toggleColumn('job_profile_name', false)
    list.reset()
    expect(list.filters.sites).toEqual([])
    expect(list.columns).toContain('job_profile_name')
  })

  it('el filtro sin cuenta de nómina cuenta como activo y se restablece', () => {
    const list = useEmployeeListStore()
    expect(list.filters.withoutPayrollAccount).toBe(false)
    list.filters.withoutPayrollAccount = true
    expect(list.activeFilterCount).toBe(2)
    list.reset()
    expect(list.filters.withoutPayrollAccount).toBe(false)
    expect(list.activeFilterCount).toBe(1)
  })
})
