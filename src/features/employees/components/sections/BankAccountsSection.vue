<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Message from 'primevue/message'
import { computed } from 'vue'
import { useEmployee } from '@/features/employees/composables/useEmployeeDetails'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'
import { listRecords } from '@/shared/lib/records'

const props = defineProps<{ employeeId: string }>()

const fields: RecordField[] = [
  {
    key: 'account_type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: ['Nómina', 'Alternativa'],
    initial: 'Nómina',
  },
  {
    key: 'bank_id',
    label: 'Banco',
    type: 'lookup',
    required: true,
    lookup: { table: 'banks', label: 'name' },
  },
  { key: 'clabe', label: 'CLABE', type: 'clabe', required: true },
  { key: 'account_number', label: 'Núm. de cuenta' },
  { key: 'holder_name', label: 'Titular' },
  { key: 'document_url', label: 'Comprobante', type: 'url', linkLabel: 'Ver comprobante' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]

const filter = computed(() => ({ employee_id: props.employeeId }))
const { data: employee } = useEmployee(() => props.employeeId)
// Misma clave que RecordEditor: reutiliza su consulta y se actualiza al guardar.
const { data: accounts } = useQuery({
  queryKey: computed(() => ['records', 'employee_bank_accounts', filter.value]),
  queryFn: () => listRecords('employee_bank_accounts', filter.value, 'created_at'),
})
const missingPayroll = computed(
  () =>
    employee.value?.employment_status === 'active' &&
    !!accounts.value &&
    !accounts.value.some((account) => account.account_type === 'Nómina'),
)
</script>

<template>
  <Message v-if="missingPayroll" severity="warn" :closable="false" class="section-notice">
    Sin cuenta de nómina: esta persona está activa y no tiene registrada una cuenta de tipo Nómina.
  </Message>
  <RecordEditor
    table="employee_bank_accounts"
    :fields="fields"
    :filter="filter"
    empty-message="Sin cuentas bancarias registradas."
  />
</template>

<style scoped>
.section-notice {
  margin-bottom: 1rem;
}
</style>
