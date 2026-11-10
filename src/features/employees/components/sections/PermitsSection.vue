<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import { PERMIT_FIELDS, permitDuration } from '@/features/leave/schemas/permit.fields'

defineProps<{ employeeId: string }>()

const extraColumns = [{ label: 'Duración', value: permitDuration }]
</script>

<template>
  <RecordEditor
    table="employee_leave_permits"
    :fields="PERMIT_FIELDS"
    :filter="{ employee_id: employeeId }"
    order-by="start_date"
    descending
    :extra-columns="extraColumns"
    delete-message="¿Eliminar este permiso? Quedará constancia en el historial de cambios."
    empty-message="Sin permisos registrados."
  />
</template>
