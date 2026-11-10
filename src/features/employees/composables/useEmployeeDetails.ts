import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import {
  getCurrentJobProfileName,
  getEmployee,
  getProfileControlNumbers,
  listEmployeeTrainingStatus,
  updateEmployee,
} from '@/features/employees/services/employees.repository'

export function useEmployee(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['employees', 'detail', computed(() => toValue(id))],
    queryFn: () => getEmployee(toValue(id)),
  })
}

export function useCurrentJobProfile(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['employees', 'current-job', computed(() => toValue(id))],
    queryFn: () => getCurrentJobProfileName(toValue(id)),
  })
}

// La clave empieza con 'records' para refrescarse al editar Números de control.
export function useProfileControlNumbers(
  id: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  return useQuery({
    queryKey: ['records', 'employee_control_numbers', 'profile', computed(() => toValue(id))],
    queryFn: () => getProfileControlNumbers(toValue(id)),
    enabled: computed(() => toValue(enabled)),
  })
}

export function useEmployeeTrainingStatus(employeeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['employees', 'training-status', computed(() => toValue(employeeId))],
    queryFn: () => listEmployeeTrainingStatus(toValue(employeeId)),
  })
}

export function useUpdateEmployee(id: MaybeRefOrGetter<string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { version: number; values: EmployeeFormValues }) =>
      updateEmployee(toValue(id), input.version, input.values),
    // También tras un conflicto, para recuperar la versión vigente.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}
