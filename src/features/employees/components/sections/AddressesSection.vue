<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'

defineProps<{ employeeId: string }>()

const fields: RecordField[] = [
  {
    key: 'address_type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: ['INE', 'Fiscal', 'Comprobante', 'Actual', 'Otro'],
  },
  { key: 'street', label: 'Calle' },
  { key: 'exterior_number', label: 'Núm. ext.' },
  { key: 'interior_number', label: 'Núm. int.' },
  { key: 'neighborhood', label: 'Colonia' },
  { key: 'postal_code', label: 'C.P.' },
  { key: 'city', label: 'Municipio' },
  { key: 'state', label: 'Estado' },
  { key: 'country', label: 'País', formOnly: true },
  { key: 'verified_on', label: 'Fecha de verificación', type: 'date', formOnly: true },
  { key: 'is_current', label: 'Vigente', type: 'boolean', initial: true },
  { key: 'document_url', label: 'Ubicación del archivo', type: 'url', linkLabel: 'Ver archivo' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employee_addresses"
    :fields="fields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin domicilios registrados."
  />
</template>
