<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const phoneFields: RecordField[] = [
  {
    key: 'phone_type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: ['Personal', 'Corporativo', 'Otro'],
  },
  { key: 'phone_number', label: 'Teléfono', required: true },
  { key: 'extension', label: 'Extensión' },
  { key: 'is_primary', label: 'Principal', type: 'boolean' },
  { key: 'is_current', label: 'Vigente', type: 'boolean', initial: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const emailFields: RecordField[] = [
  {
    key: 'email_type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: ['Licitaciones', 'Corporativo', 'Personal'],
  },
  { key: 'email', label: 'Correo electrónico', required: true },
  { key: 'is_primary', label: 'Principal', type: 'boolean' },
  { key: 'is_active', label: 'Activo', type: 'boolean', initial: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const emergencyFields: RecordField[] = [
  { key: 'full_name', label: 'Nombre completo', required: true },
  { key: 'relationship', label: 'Parentesco' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'is_primary', label: 'Principal', type: 'boolean' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const beneficiaryFields: RecordField[] = [
  { key: 'full_name', label: 'Nombre completo', required: true },
  { key: 'relationship', label: 'Parentesco' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_phones"
    title="Teléfonos"
    :fields="phoneFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin teléfonos registrados."
  />
  <RecordEditor
    table="employee_emails"
    title="Correos"
    :fields="emailFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin correos registrados."
  />
  <RecordEditor
    table="emergency_contacts"
    title="Contactos de emergencia"
    :fields="emergencyFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin contactos de emergencia."
  />
  <RecordEditor
    table="beneficiaries"
    title="Beneficiarios"
    :fields="beneficiaryFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin beneficiarios."
  />
</template>
