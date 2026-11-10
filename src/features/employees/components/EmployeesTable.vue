<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import { computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'
import {
  EMPLOYEE_COLUMNS,
  EMPLOYEE_STATUS_LABELS,
  type EmployeeDirectoryRow,
} from '@/features/employees/types/employee.types'
import { formatDate, initials } from '@/shared/utils/format'
import { useDesignMode } from '@/shared/design/design-mode'
const { isNext } = useDesignMode()

const props = defineProps<{ employees: EmployeeDirectoryRow[] | undefined; loading: boolean }>()
const rows = computed(() => props.employees ?? [])

const auth = useAuthStore()
const list = useEmployeeListStore()
const optionalColumns = computed(() =>
  EMPLOYEE_COLUMNS.filter(
    (column) => list.columns.includes(column.key) && (!column.hrOnly || auth.hasAnyRole(['hr'])),
  ),
)

function display(row: EmployeeDirectoryRow, key: (typeof EMPLOYEE_COLUMNS)[number]['key']) {
  if (key === 'hire_date' || key === 'termination_date') return formatDate(row[key])
  return row[key] ?? '—'
}

const SEVERITY: Record<string, string> = {
  active: 'success',
  onboarding: 'info',
  terminated: 'secondary',
}
</script>

<template>
  <DataTable
    :value="rows"
    :loading="loading"
    paginator
    :rows="25"
    :always-show-paginator="false"
    scrollable
  >
    <template #empty>No hay empleados con estos criterios.</template>
    <Column field="full_name" header="Nombre">
      <template #body="{ data }">
        <div v-if="isNext" class="next-person">
          <span class="next-avatar" aria-hidden="true">{{ initials(data.full_name) }}</span>
          <span class="next-person-text">
            <RouterLink :to="{ name: 'employee-detail', params: { id: data.id } }">
              {{ data.full_name }}
            </RouterLink>
            <small>{{ data.employee_number }}</small>
          </span>
        </div>
        <RouterLink v-else :to="{ name: 'employee-detail', params: { id: data.id } }">
          {{ data.full_name }}
        </RouterLink>
      </template>
    </Column>
    <Column
      v-for="column in optionalColumns"
      :key="column.key"
      :field="column.key"
      :header="column.label"
    >
      <template #body="{ data }">{{ display(data, column.key) }}</template>
    </Column>
    <Column field="employment_status" header="Estatus">
      <template #body="{ data }">
        <Tag
          :class="isNext ? `next-status next-status-${data.employment_status}` : undefined"
          :value="EMPLOYEE_STATUS_LABELS[data.employment_status] ?? data.employment_status"
          :severity="SEVERITY[data.employment_status] ?? 'secondary'"
        />
      </template>
    </Column>
    <Column v-if="isNext" header="Expediente">
      <template #body="{ data }">
        <RouterLink
          class="next-record-link"
          :to="{ name: 'employee-detail', params: { id: data.id } }"
          :aria-label="`Abrir expediente de ${data.full_name}`"
          title="Abrir expediente"
        >
          <i class="pi pi-eye" aria-hidden="true" />
        </RouterLink>
      </template>
    </Column>
  </DataTable>
</template>
