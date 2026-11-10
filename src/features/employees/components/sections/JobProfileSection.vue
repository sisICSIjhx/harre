<script setup lang="ts">
import { computed } from 'vue'
import { useEmployeeTrainingStatus } from '@/features/employees/composables/useEmployeeDetails'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import RecordsTable from '@/shared/components/RecordsTable.vue'
import type { RecordField } from '@/shared/lib/record-fields'

const props = defineProps<{ employeeId: string }>()

const STATUS_LABELS: Record<string, string> = {
  missing: 'Faltante',
  expired: 'Vencido',
  unverified: 'Por verificar',
  current: 'Vigente',
}

const fields: RecordField[] = [
  {
    key: 'job_profile_id',
    label: 'Puesto',
    type: 'lookup',
    required: true,
    lookup: { table: 'job_profiles', label: 'name' },
  },
  {
    key: 'project_id',
    label: 'Proyecto',
    type: 'lookup',
    lookup: { table: 'projects', label: 'name' },
  },
  { key: 'start_date', label: 'Inicio', type: 'date' },
  { key: 'end_date', label: 'Fin', type: 'date' },
  { key: 'is_primary', label: 'Principal', type: 'boolean' },
  { key: 'work_center', label: 'Centro de trabajo' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]

const { data, isPending, isError } = useEmployeeTrainingStatus(() => props.employeeId)
const rows = computed(() =>
  data.value?.map((row) => ({
    ...row,
    status_label: STATUS_LABELS[row.training_status ?? ''] ?? row.training_status,
  })),
)
</script>

<template>
  <p class="muted">
    Una persona puede tener varios puestos, uno por proyecto. Para terminar uno, captura su fecha de
    fin: queda en el historial. Si lo registraste por error, puedes eliminar la asignación.
  </p>
  <RecordEditor
    table="employee_assignments"
    title="Puestos"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    order-by="start_date"
    delete-message="¿Eliminar esta asignación de puesto? Se quitará del expediente y sus cursos dejarán de exigirse por esta asignación. Quedará constancia en el historial de cambios. Para conservar el puesto como historial, cancela y captura su fecha de fin."
    empty-message="Sin puestos asignados."
  />
  <h2>Cursos obligatorios de sus puestos vigentes</h2>
  <RecordsTable
    :rows="rows"
    :loading="isPending"
    :error="isError"
    empty-message="Sus puestos vigentes no tienen cursos obligatorios."
    :columns="[
      { field: 'course_name', header: 'Curso' },
      { field: 'status_label', header: 'Estado' },
      { field: 'completed_on', header: 'Realizado', kind: 'date' },
      { field: 'expires_on', header: 'Vigencia', kind: 'date' },
    ]"
  />
</template>

<style scoped>
h2 {
  font-size: 1.05rem;
}

p {
  margin-top: 0;
  font-size: 0.875rem;
}
</style>
