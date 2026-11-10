<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const fields: RecordField[] = [
  { key: 'company', label: 'Empresa' },
  {
    key: 'company_type',
    label: 'Tipo de empresa',
    type: 'select',
    options: ['ICSI', 'Externa'],
    formOnly: true,
  },
  { key: 'position_title', label: 'Puesto' },
  { key: 'project_name', label: 'Proyecto' },
  { key: 'start_date', label: 'Inicio', type: 'date' },
  { key: 'end_date', label: 'Fin', type: 'date' },
  { key: 'period_text', label: 'Periodo (si no se conocen las fechas)', formOnly: true },
  { key: 'municipality', label: 'Municipio', formOnly: true },
  { key: 'state', label: 'Estado', formOnly: true },
  { key: 'country', label: 'País', formOnly: true },
  { key: 'work_location_detail', label: 'Lugar de trabajo', formOnly: true },
  { key: 'work_reference', label: 'Referencia laboral', formOnly: true },
  {
    key: 'verification_status',
    label: 'Verificación',
    type: 'select',
    required: true,
    options: ['Sin verificar', 'Referencia disponible', 'Verificado'],
    initial: 'Sin verificar',
  },
  { key: 'activities', label: 'Actividades realizadas', type: 'textarea', formOnly: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_experience"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin experiencia registrada."
  />
</template>
