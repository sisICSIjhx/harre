<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const EVIDENCE = ['No entregado', 'Recibido', 'Verificado', 'No aplica']

const fields: RecordField[] = [
  {
    key: 'level',
    label: 'Grado reportado',
    type: 'select',
    required: true,
    options: [
      'Secundaria',
      'Bachillerato',
      'Carrera técnica',
      'Lic./Ing. pasante',
      'Lic./Ing. titulado',
      'Posgrado',
      'Otro / por determinar',
    ],
  },
  { key: 'degree_title', label: 'Carrera o especialidad' },
  { key: 'institution', label: 'Institución' },
  { key: 'start_date', label: 'Inicio', type: 'date', formOnly: true },
  { key: 'end_date', label: 'Fin', type: 'date' },
  { key: 'municipality', label: 'Municipio', formOnly: true },
  { key: 'state', label: 'Estado', formOnly: true },
  { key: 'country', label: 'País', formOnly: true },
  {
    key: 'certificate_status',
    label: 'Certificado',
    type: 'select',
    required: true,
    options: EVIDENCE,
    initial: 'No entregado',
  },
  {
    key: 'diploma_status',
    label: 'Título',
    type: 'select',
    required: true,
    options: EVIDENCE,
    initial: 'No entregado',
  },
  {
    key: 'license_status',
    label: 'Cédula',
    type: 'select',
    required: true,
    options: EVIDENCE,
    initial: 'No entregado',
  },
  { key: 'professional_license', label: 'Número de cédula', formOnly: true },
  {
    key: 'validation_status',
    label: 'Validación',
    type: 'select',
    required: true,
    options: ['Pendiente', 'En revisión', 'Validado', 'Rechazado'],
    initial: 'Pendiente',
  },
  { key: 'is_highest_level', label: 'Grado máximo', type: 'boolean' },
  { key: 'reviewed_on', label: 'Fecha de revisión', type: 'date', formOnly: true },
  { key: 'reviewed_by', label: 'Revisado por', formOnly: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_education"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin estudios registrados."
  />
</template>
