import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import {
  createEmployee,
  listEmployeeFilterOptions,
  listEmployees,
} from '@/features/employees/services/employees.repository'
import type { EmployeeFilters } from '@/features/employees/types/employee.types'

export function useEmployees(filters: MaybeRefOrGetter<EmployeeFilters>) {
  return useQuery({
    queryKey: ['employees', 'list', computed(() => toValue(filters))],
    queryFn: () => listEmployees(toValue(filters)),
  })
}

export function useEmployeeFilterOptions() {
  return useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: listEmployeeFilterOptions,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}
