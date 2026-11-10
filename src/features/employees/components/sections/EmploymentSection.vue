<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'
import { SIGNED_DOCUMENTS } from '@/features/employees/schemas/signed-document.fields'

defineProps<{ employeeId: string }>()

// Ingreso, Alta IMSS y Baja son de la relación con la empresa; cada contrato, incluidas sus
// renovaciones, se registra aparte. Las fechas del contrato no aplican cuando es indeterminado.
const employmentFields: RecordField[] = [
  { key: 'company', label: 'Empresa', required: true, initial: 'ICSI' },
  { key: 'hire_date', label: 'Ingreso', type: 'date' },
  { key: 'imss_registration_date', label: 'Alta IMSS', type: 'date' },
  { key: 'termination_date', label: 'Baja', type: 'date' },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: ['Activo', 'Finalizado', 'Suspendido'],
    initial: 'Activo',
  },
  { key: 'work_center', label: 'Centro de trabajo' },
  { key: 'area', label: 'Área' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const hasContractDates = (values: Record<string, unknown>) =>
  values.contract_type !== 'Indeterminado'
const contractFields: RecordField[] = [
  {
    key: 'contract_type',
    label: 'Contrato',
    type: 'select',
    required: true,
    options: [
      'Indeterminado',
      'Determinado',
      'Por meses',
      'Por obra determinada',
      'Por ocasión',
      'Por temporada',
      'Periodo de prueba',
      'Capacitación inicial',
      'Proyecto',
      'Honorarios',
      'Otro',
    ],
  },
  { key: 'start_date', label: 'Inicio', type: 'date', visibleWhen: hasContractDates },
  { key: 'end_date', label: 'Término', type: 'date', visibleWhen: hasContractDates },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const siteFields: RecordField[] = [
  { key: 'site', label: 'Sede', required: true },
  { key: 'site_type', label: 'Tipo', initial: 'Centro de trabajo' },
  { key: 'start_date', label: 'Inicio', type: 'date' },
  { key: 'end_date', label: 'Fin', type: 'date' },
  { key: 'is_current', label: 'Vigente', type: 'boolean', initial: true },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <RecordEditor
    table="employment_records"
    title="Altas y bajas"
    :fields="employmentFields"
    :filter="{ employee_id: employeeId }"
    delete-message="¿Eliminar esta alta? Quedará constancia en el historial de cambios. Para registrar una salida, captura la fecha de baja en lugar de eliminarla."
    empty-message="Sin altas registradas."
  />
  <RecordEditor
    table="employee_contracts"
    title="Contratos"
    :fields="contractFields"
    :filter="{ employee_id: employeeId }"
    delete-message="¿Eliminar este contrato? Quedará constancia en el historial de cambios."
    empty-message="Sin contratos registrados."
  />
  <RecordEditor
    v-for="item in SIGNED_DOCUMENTS"
    :key="`${item.kind}-${employeeId}`"
    table="employee_confidentiality_agreements"
    :title="item.title"
    :fields="item.fields"
    :filter="{ employee_id: employeeId, document_kind: item.kind }"
    order-by="signed_on"
    :empty-message="item.empty"
  />
  <RecordEditor
    table="employee_work_sites"
    title="Sedes"
    :fields="siteFields"
    :filter="{ employee_id: employeeId }"
    empty-message="Sin sedes registradas."
  />
</template>
