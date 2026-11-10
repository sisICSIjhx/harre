<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const accreditationFields: RecordField[] = [
  {
    key: 'course_id',
    label: 'Curso',
    type: 'lookup',
    required: true,
    lookup: { table: 'courses', label: 'name' },
  },
  { key: 'completed_on', label: 'Fecha de acreditación', type: 'date' },
  { key: 'expires_on', label: 'Vencimiento', type: 'date' },
  {
    key: 'evidence_type',
    label: 'Evidencia',
    type: 'select',
    options: ['DC-3', 'Certificación', 'Constancia', 'Otro'],
  },
  { key: 'certificate_folio', label: 'Folio' },
  { key: 'issuer', label: 'Emisor' },
  { key: 'duration_hours', label: 'Horas', type: 'number' },
  {
    key: 'document_url',
    label: 'Ubicación del documento',
    type: 'url',
    linkLabel: 'Ver documento',
  },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const requirementFields: RecordField[] = [
  {
    key: 'course_id',
    label: 'Curso',
    type: 'lookup',
    required: true,
    lookup: { table: 'courses', label: 'name' },
  },
  { key: 'is_mandatory', label: 'Obligatorio', type: 'boolean', initial: true },
  { key: 'deadline', label: 'Fecha límite', type: 'date' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_courses"
    title="Cursos acreditados"
    :fields="accreditationFields"
    :filter="{ employee_id: employeeId }"
    order-by="completed_on"
    empty-message="Sin cursos acreditados."
  />
  <RecordEditor
    table="employee_course_requirements"
    title="Cursos adicionales exigidos con fecha límite"
    :fields="requirementFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin cursos adicionales."
  />
</template>
