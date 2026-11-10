<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const fields: RecordField[] = [
  {
    key: 'system_id',
    label: 'Sistema',
    type: 'lookup',
    required: true,
    lookup: { table: 'external_systems', label: 'name' },
  },
  { key: 'control_number', label: 'Número de personal', required: true },
  {
    key: 'status',
    label: 'Estatus',
    type: 'select',
    required: true,
    options: ['Activo', 'Inactivo'],
    initial: 'Activo',
  },
  { key: 'work_center', label: 'Centro de trabajo' },
  { key: 'assigned_on', label: 'Asignado', type: 'date' },
  { key: 'ended_on', label: 'Baja', type: 'date', formOnly: true },
  { key: 'verified_on', label: 'Verificado', type: 'date' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_control_numbers"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin números de control registrados."
  />
</template>
