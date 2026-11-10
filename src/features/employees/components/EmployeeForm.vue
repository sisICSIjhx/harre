<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DateInput from '@/shared/components/DateInput.vue'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useForm } from 'vee-validate'
import { nextTick } from 'vue'
import {
  employeeSchema,
  type EmployeeFormInput,
  type EmployeeFormValues,
} from '@/features/employees/schemas/employee.schema'
import { EMPLOYEE_STATUS_LABELS } from '@/features/employees/types/employee.types'
import { toFormSchema } from '@/shared/lib/form-schema'
import { useDesignMode } from '@/shared/design/design-mode'
import { useUnsavedChanges } from '@/shared/design/unsaved-changes'

const props = defineProps<{ initialValues?: EmployeeFormInput; submitting: boolean }>()
const emit = defineEmits<{ submit: [values: EmployeeFormValues]; cancel: [] }>()

const statusOptions = Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const { defineField, errors, handleSubmit, meta, values, resetForm } = useForm({
  validationSchema: toFormSchema(employeeSchema),
  initialValues: props.initialValues ?? { employment_status: 'active' },
})
const [employeeNumber] = defineField('employee_number')
const [firstName] = defineField('first_name')
const [lastName] = defineField('last_name')
const [secondLastName] = defineField('second_last_name')
const [status] = defineField('employment_status')
const [hireDate] = defineField('hire_date')
const [terminationDate] = defineField('termination_date')
const [notes] = defineField('notes')

const submit = handleSubmit(
  (values) => emit('submit', values),
  ({ errors }) => nextTick(() => document.getElementById(Object.keys(errors)[0] ?? '')?.focus()),
)
const { isNext } = useDesignMode()
const { canDiscard } = useUnsavedChanges(
  () => meta.value.dirty,
  () => props.submitting,
)
function markSaved() {
  resetForm({ values: { ...values } })
}
defineExpose({ markSaved, canDiscard })
</script>

<template>
  <form class="form-stack" novalidate @submit.prevent="submit">
    <p v-if="isNext" class="muted">
      Los campos con * son obligatorios. Los demás pueden completarse después.
    </p>
    <div class="form-grid employee-form-grid">
      <section class="next-form-section">
        <div v-if="isNext" class="next-form-aside">
          <h2>Identificación</h2>
          <p>Nombre y número con los que se localizará el expediente.</p>
        </div>
        <div class="employee-field-grid">
          <div class="form-field">
            <label for="employee_number">Número de empleado</label>
            <InputText
              id="employee_number"
              v-model="employeeNumber"
              placeholder="Vacío: se asigna automáticamente"
              :invalid="!!errors.employee_number"
              :aria-invalid="!!errors.employee_number"
              :aria-describedby="errors.employee_number ? 'employee_number-error' : undefined"
            />
            <small
              v-if="errors.employee_number"
              id="employee_number-error"
              role="alert"
              class="form-error"
            >
              {{ errors.employee_number }}
            </small>
          </div>
          <div class="form-field">
            <label for="first_name">Nombres *</label>
            <InputText
              id="first_name"
              v-model="firstName"
              :invalid="!!errors.first_name"
              :aria-invalid="!!errors.first_name"
              :aria-describedby="errors.first_name ? 'first_name-error' : undefined"
            />
            <small v-if="errors.first_name" id="first_name-error" role="alert" class="form-error">
              {{ errors.first_name }}
            </small>
          </div>
          <div class="form-field">
            <label for="last_name">Apellido paterno</label>
            <InputText
              id="last_name"
              v-model="lastName"
              :invalid="!!errors.last_name"
              :aria-invalid="!!errors.last_name"
              :aria-describedby="errors.last_name ? 'last_name-error' : undefined"
            />
            <small v-if="errors.last_name" id="last_name-error" role="alert" class="form-error">
              {{ errors.last_name }}
            </small>
          </div>
          <div class="form-field">
            <label for="second_last_name">Apellido materno</label>
            <InputText id="second_last_name" v-model="secondLastName" />
          </div>
        </div>
      </section>
      <section class="next-form-section">
        <div v-if="isNext" class="next-form-aside">
          <h2>Relación laboral</h2>
          <p>Estado y fechas del registro de personal.</p>
        </div>
        <div class="employee-field-grid">
          <div class="form-field">
            <label for="hire_date">Fecha de alta</label>
            <DateInput
              id="hire_date"
              v-model="hireDate"
              calendar-label="Fecha de alta"
              :invalid="!!errors.hire_date"
              :aria-invalid="!!errors.hire_date"
              :aria-describedby="errors.hire_date ? 'hire_date-error' : undefined"
            />
            <small v-if="errors.hire_date" id="hire_date-error" role="alert" class="form-error">
              {{ errors.hire_date }}
            </small>
          </div>
          <div class="form-field">
            <label for="termination_date">Fecha de baja</label>
            <DateInput
              id="termination_date"
              v-model="terminationDate"
              calendar-label="Fecha de baja"
              :invalid="!!errors.termination_date"
              :aria-invalid="!!errors.termination_date"
              :aria-describedby="errors.termination_date ? 'termination_date-error' : undefined"
            />
            <small
              v-if="errors.termination_date"
              id="termination_date-error"
              role="alert"
              class="form-error"
            >
              {{ errors.termination_date }}
            </small>
          </div>
          <div class="form-field">
            <label for="employment_status">Estatus</label>
            <Select
              v-model="status"
              input-id="employment_status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :invalid="!!errors.employment_status"
              :aria-invalid="!!errors.employment_status"
              :aria-describedby="errors.employment_status ? 'employment_status-error' : undefined"
            />
            <small
              v-if="errors.employment_status"
              id="employment_status-error"
              role="alert"
              class="form-error"
            >
              {{ errors.employment_status }}
            </small>
          </div>
          <div class="form-field">
            <label for="notes">Observaciones</label>
            <Textarea id="notes" v-model="notes" rows="2" auto-resize />
          </div>
        </div>
      </section>
    </div>
    <div class="form-actions">
      <p v-if="isNext" class="next-form-state" role="status">
        {{
          submitting ? 'Guardando…' : meta.dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'
        }}
      </p>
      <Button type="button" label="Cancelar" severity="secondary" text @click="emit('cancel')" />
      <Button
        type="submit"
        :label="isNext ? 'Guardar cambios' : 'Guardar'"
        icon="pi pi-check"
        :loading="submitting"
      />
    </div>
  </form>
</template>
