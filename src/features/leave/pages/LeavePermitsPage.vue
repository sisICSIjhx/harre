<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import DateInput from '@/shared/components/DateInput.vue'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import PageIntro from '@/shared/design/PageIntro.vue'
import { listRecords, type RecordRow } from '@/shared/lib/records'
import {
  PERMIT_FIELDS_WITH_EMPLOYEE,
  PERMIT_TYPES,
  permitDuration,
} from '@/features/leave/schemas/permit.fields'

// RRHH registra y edita; Nómina solo consulta (la edición la limitan RecordEditor y RLS).
const auth = useAuthStore()
const canEdit = computed(() => auth.hasAnyRole(['hr']))

// Permisos de todo el personal. Los filtros son de pantalla: no se aplican a los registros nuevos,
// donde la persona se elige en el formulario.
const employeeId = ref<string | null>(null)
const permitType = ref<string | null>(null)
const from = ref<string | null>(null)
const to = ref<string | null>(null)

// Misma consulta que las opciones de «Persona» del formulario: comparten caché.
const employees = useQuery({
  queryKey: ['records', 'vw_employee_directory', 'options', {}],
  queryFn: () => listRecords('vw_employee_directory', {}, 'full_name'),
})
const employeeOptions = computed(() =>
  (employees.data.value ?? []).map((row) => ({
    label: String(row.full_name),
    value: row.id as string,
  })),
)

const hasFilters = computed(
  () => !!(employeeId.value || permitType.value || from.value || to.value),
)
function clearFilters() {
  employeeId.value = permitType.value = from.value = to.value = null
}

// Un permiso entra en el periodo si alguno de sus días cae entre «Desde» y «Hasta».
const rowFilter = computed(() => (row: RecordRow) => {
  const start = String(row.start_date)
  const end = String(row.end_date ?? row.start_date)
  return (
    (!employeeId.value || row.employee_id === employeeId.value) &&
    (!permitType.value || row.permit_type === permitType.value) &&
    (!from.value || end >= from.value) &&
    (!to.value || start <= to.value)
  )
})
const extraColumns = [{ label: 'Duración', value: permitDuration }]
</script>

<template>
  <div class="page-header">
    <h1>Permisos</h1>
  </div>
  <PageIntro
    :text="`${canEdit ? 'Consulta y registra' : 'Consulta'} los permisos del personal por días u horas. También aparecen en la sección Permisos del expediente de cada persona.`"
  />
  <div class="permit-filters" role="search" aria-label="Filtrar permisos">
    <div class="form-field">
      <label for="permit-filter-employee">Persona</label>
      <Select
        v-model="employeeId"
        input-id="permit-filter-employee"
        :options="employeeOptions"
        option-label="label"
        option-value="value"
        :loading="employees.isPending.value"
        filter
        show-clear
        reset-filter-on-hide
        placeholder="Todo el personal"
      />
    </div>
    <div class="form-field">
      <label for="permit-filter-type">Tipo</label>
      <Select
        v-model="permitType"
        input-id="permit-filter-type"
        :options="[...PERMIT_TYPES]"
        show-clear
        placeholder="Días y horas"
      />
    </div>
    <div class="form-field">
      <label for="permit-filter-from">Desde</label>
      <DateInput id="permit-filter-from" v-model="from" valid-only calendar-label="Desde" />
    </div>
    <div class="form-field">
      <label for="permit-filter-to">Hasta</label>
      <DateInput id="permit-filter-to" v-model="to" valid-only calendar-label="Hasta" />
    </div>
    <Button
      v-if="hasFilters"
      class="permit-filters-clear"
      label="Limpiar filtros"
      icon="pi pi-filter-slash"
      severity="secondary"
      text
      @click="clearFilters"
    />
  </div>
  <RecordEditor
    table="employee_leave_permits"
    title="Permisos"
    :fields="PERMIT_FIELDS_WITH_EMPLOYEE"
    order-by="start_date"
    descending
    :row-filter="rowFilter"
    :extra-columns="extraColumns"
    delete-message="¿Eliminar este permiso? Quedará constancia en el historial de cambios."
    :empty-message="
      hasFilters ? 'Ningún permiso coincide con los filtros.' : 'Aún no hay permisos registrados.'
    "
  />
</template>

<style scoped>
.permit-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1.25rem;
}

.permit-filters .form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.permit-filters-clear {
  justify-self: start;
}
</style>
