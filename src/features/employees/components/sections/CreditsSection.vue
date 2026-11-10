<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

// Por ahora solo el número; texto para conservar ceros iniciales. Nómina consulta sin editar.
const fields: RecordField[] = [
  {
    key: 'credit_type',
    label: 'Crédito',
    type: 'select',
    required: true,
    options: ['INFONAVIT', 'FONACOT'],
  },
  { key: 'credit_number', label: 'Número de crédito', required: true },
]
</script>

<template>
  <RecordEditor
    table="employee_credits"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    order-by="credit_type"
    empty-message="Sin créditos registrados."
  />
</template>
