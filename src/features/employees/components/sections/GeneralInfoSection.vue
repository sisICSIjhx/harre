<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useDesignMode } from '@/shared/design/design-mode'
import type { FormHandle } from '@/shared/design/unsaved-changes'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import EmployeePhoto from '@/features/employees/components/sections/EmployeePhoto.vue'
import { useCurrentJobProfile } from '@/features/employees/composables/useEmployeeDetails'
import { getSensitiveData } from '@/features/employees/services/employees.repository'
import { EMPLOYEE_STATUS_LABELS, type Employee } from '@/features/employees/types/employee.types'
import RecordForm from '@/shared/components/RecordForm.vue'
import { isFieldVisible, type RecordField } from '@/shared/lib/record-fields'
import { RecordError, upsertRecord, type RecordRow } from '@/shared/lib/records'
import { formatDate } from '@/shared/utils/format'

const props = defineProps<{
  employee: Employee & { hire_date: string | null; termination_date: string | null }
}>()

const auth = useAuthStore()
const { isNext } = useDesignMode()
const editingPersonal = ref(false)
const personalForm = ref<FormHandle>()
const queryClient = useQueryClient()
const toast = useToast()
const canManage = computed(() => auth.hasAnyRole(['hr']))

const { data: jobProfile } = useCurrentJobProfile(() => props.employee.id)

const items = computed(() => [
  { label: 'Número de empleado', value: props.employee.employee_number },
  { label: 'Puesto actual', value: jobProfile.value ?? '—' },
  {
    label: 'Estatus',
    value:
      EMPLOYEE_STATUS_LABELS[props.employee.employment_status] ?? props.employee.employment_status,
  },
  // Exclusivas de RRHH: para otros perfiles no se muestran.
  ...(canManage.value
    ? [
        { label: 'Fecha de alta', value: formatDate(props.employee.hire_date) },
        { label: 'Fecha de baja', value: formatDate(props.employee.termination_date) },
      ]
    : []),
  { label: 'Observaciones', value: props.employee.notes ?? '—', wide: true },
])

const sensitiveFields: RecordField[] = [
  { key: 'birth_date', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'curp', label: 'CURP' },
  { key: 'rfc', label: 'RFC' },
  { key: 'nss', label: 'NSS' },
  {
    key: 'blood_type',
    label: 'Tipo de sangre',
    type: 'select',
    options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'],
  },
  { key: 'allergies', label: 'Alergias' },
  {
    key: 'has_medical_certificate',
    label: 'Certificado médico',
    type: 'select',
    options: ['Sí', 'No'],
  },
  // Solo si tiene certificado; con «No» o sin respuesta se oculta y se guarda vacía.
  {
    key: 'medical_certificate_date',
    label: 'Fecha del certificado médico',
    type: 'date',
    visibleWhen: (values) => values.has_medical_certificate === 'Sí',
  },
]

const sensitiveValues = computed(() => (sensitive.data.value ?? {}) as Record<string, unknown>)
const visibleSensitiveFields = computed(() =>
  sensitiveFields.filter((field) => isFieldVisible(field, sensitiveValues.value)),
)

const sensitive = useQuery({
  queryKey: ['employees', 'sensitive', computed(() => props.employee.id)],
  queryFn: () => getSensitiveData(props.employee.id),
  enabled: canManage,
})

const save = useMutation({
  mutationFn: (values: RecordRow) =>
    upsertRecord('employee_sensitive_data', { ...values, employee_id: props.employee.id }),
  onSuccess: () => {
    personalForm.value?.markSaved()
    editingPersonal.value = false
    void queryClient.invalidateQueries({ queryKey: ['employees', 'sensitive'] })
    toast.add({ severity: 'success', summary: 'Datos personales guardados', life: 3000 })
  },
  onError: (error) =>
    toast.add({
      severity: 'error',
      summary: 'No se guardó',
      detail: error instanceof RecordError ? error.message : 'Intenta de nuevo.',
      life: 6000,
    }),
})
</script>

<template>
  <div class="general-layout">
    <EmployeePhoto
      v-if="canManage"
      :employee-id="employee.id"
      :employee-number="employee.employee_number"
    />
    <dl class="general-info">
      <div v-for="item in items" :key="item.label" :class="{ 'item-wide': item.wide }">
        <dt class="muted">{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>
  </div>
  <template v-if="canManage && !sensitive.isPending.value">
    <h2>Datos personales</h2>
    <p class="muted">
      Información de acceso restringido a RRHH. Se incluye en la publicación del Excel de RRHH.
    </p>
    <Message v-if="isNext && sensitive.isError.value" severity="error" :closable="false">
      No fue posible cargar los datos personales.
      <Button label="Reintentar" text @click="sensitive.refetch()" />
    </Message>
    <div v-if="isNext && !editingPersonal && !sensitive.isError.value" class="next-personal-read">
      <dl class="general-info">
        <div v-for="field in visibleSensitiveFields" :key="field.key">
          <dt class="muted">{{ field.label }}</dt>
          <dd>
            {{
              field.type === 'date'
                ? formatDate(sensitive.data.value?.[field.key as keyof typeof sensitive.data.value])
                : sensitive.data.value?.[field.key as keyof typeof sensitive.data.value] || '—'
            }}
          </dd>
        </div>
      </dl>
      <Button
        label="Editar datos personales"
        icon="pi pi-pencil"
        severity="secondary"
        @click="editingPersonal = true"
      />
    </div>
    <div
      v-show="!isNext || (editingPersonal && !sensitive.isError.value)"
      class="sensitive-form"
      @input="editingPersonal = true"
      @change="editingPersonal = true"
    >
      <RecordForm
        ref="personalForm"
        :key="sensitive.data.value?.updated_at ?? 'new'"
        :fields="sensitiveFields"
        :initial-values="sensitive.data.value ?? {}"
        :submitting="save.isPending.value"
        submit-label="Guardar datos personales"
        @submit="save.mutate($event)"
      />
    </div>
  </template>
</template>

<style scoped>
.general-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.5rem;
}

.general-info {
  flex: 1 1 20rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 1rem;
  margin: 0;
}

.item-wide {
  grid-column: 1 / -1;
}

dd {
  margin: 0.25rem 0 0;
}

h2 {
  font-size: 1.05rem;
  margin: 1.5rem 0 0.25rem;
}

p {
  margin: 0 0 1rem;
  font-size: 0.875rem;
}
</style>
