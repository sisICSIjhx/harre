import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { EmployeeColumnKey, EmployeeFilters } from '@/features/employees/types/employee.types'
import { EMPLOYEE_COLUMNS } from '@/features/employees/types/employee.types'

type AdvancedFilters = Omit<EmployeeFilters, 'search'>

function defaultFilters(): AdvancedFilters {
  return {
    statuses: ['active'],
    jobProfiles: [],
    projects: [],
    sites: [],
    hireFrom: null,
    hireTo: null,
    terminationFrom: null,
    terminationTo: null,
    withoutPayrollAccount: false,
  }
}

function defaultColumns(): EmployeeColumnKey[] {
  return EMPLOYEE_COLUMNS.filter((column) => column.visibleByDefault).map((column) => column.key)
}

// Qué filtros usa cada columna: quitar la columna también quita sus filtros.
const COLUMN_FILTERS: Record<EmployeeColumnKey, (keyof AdvancedFilters)[]> = {
  job_profile_name: ['jobProfiles'],
  project_name: ['projects'],
  site: ['sites'],
  hire_date: ['hireFrom', 'hireTo'],
  termination_date: ['terminationFrom', 'terminationTo'],
}

function isSet(value: AdvancedFilters[keyof AdvancedFilters]): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value
}

// En un store para conservar búsqueda, filtros y columnas al volver de un expediente.
export const useEmployeeListStore = defineStore('employee-list', () => {
  const search = ref('')
  const filters = reactive<AdvancedFilters>(defaultFilters())
  const columns = ref<EmployeeColumnKey[]>(defaultColumns())

  const activeFilterCount = computed(
    () => Object.values(filters).filter((value) => isSet(value)).length,
  )

  function setFilter<K extends keyof AdvancedFilters>(
    column: EmployeeColumnKey,
    key: K,
    value: AdvancedFilters[K],
  ) {
    filters[key] = value
    // Se ve la columna por la que se está filtrando.
    if (isSet(value) && !columns.value.includes(column)) columns.value.push(column)
  }

  function toggleColumn(column: EmployeeColumnKey, visible: boolean) {
    if (visible) {
      if (!columns.value.includes(column)) columns.value.push(column)
      return
    }
    columns.value = columns.value.filter((key) => key !== column)
    const blank = defaultFilters()
    for (const key of COLUMN_FILTERS[column]) Object.assign(filters, { [key]: blank[key] })
  }

  function reset() {
    Object.assign(filters, defaultFilters())
    columns.value = defaultColumns()
  }

  // Al cerrar sesión: otra persona, quizá con otro perfil, no hereda la vista.
  function clear() {
    search.value = ''
    reset()
  }

  return { search, filters, columns, activeFilterCount, setFilter, toggleColumn, reset, clear }
})
