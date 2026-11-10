<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { FormHandle } from '@/shared/design/unsaved-changes'
import PageIntro from '@/shared/design/PageIntro.vue'
import EmployeeForm from '@/features/employees/components/EmployeeForm.vue'
import { useEmployee, useUpdateEmployee } from '@/features/employees/composables/useEmployeeDetails'
import type { EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import {
  DuplicateEmployeeNumberError,
  EmployeeConflictError,
} from '@/features/employees/services/employees.repository'
import type { EmployeeStatus } from '@/features/employees/types/employee.types'

const props = defineProps<{ id: string }>()

const router = useRouter()
const form = ref<FormHandle>()
const toast = useToast()
const { data: employee, isPending, isError, refetch } = useEmployee(() => props.id)
const { mutate, isPending: isSaving } = useUpdateEmployee(() => props.id)
const conflict = ref('')

// Versión con la que se abrió el formulario. Una recarga en segundo plano no la cambia:
// así no se pierde la captura en curso y una edición ajena se detecta como conflicto al guardar.
const base = shallowRef<typeof employee.value>()
watch(
  employee,
  (value) => {
    base.value ??= value
  },
  { immediate: true },
)

async function reload() {
  if (form.value && !(await form.value.canDiscard())) return
  const { data } = await refetch()
  if (data) {
    base.value = data
    conflict.value = ''
  }
}

function goToDetail() {
  return router.push({ name: 'employee-detail', params: { id: props.id } })
}

function save(values: EmployeeFormValues) {
  if (!base.value) return
  conflict.value = ''
  mutate(
    { version: base.value.version, values },
    {
      onSuccess: async () => {
        form.value?.markSaved()
        toast.add({
          severity: 'success',
          summary: 'Cambios guardados',
          detail: 'La publicación a Excel queda pendiente.',
          life: 4000,
        })
        await goToDetail()
      },
      onError: (error) => {
        if (error instanceof EmployeeConflictError) {
          conflict.value = error.message
          return
        }
        toast.add({
          severity: 'error',
          summary: 'No se guardaron los cambios',
          detail:
            error instanceof DuplicateEmployeeNumberError ? error.message : 'Intenta de nuevo.',
          life: 6000,
        })
      },
    },
  )
}
</script>

<template>
  <div class="page-header">
    <h1>Editar empleado</h1>
  </div>
  <PageIntro
    text="Actualiza la identificación y la relación laboral. El resto de la información se edita en cada sección del expediente."
  />
  <ProgressSpinner v-if="isPending" aria-label="Cargando" />
  <Message v-else-if="isError || !base" severity="error" :closable="false">
    No fue posible cargar este expediente.
  </Message>
  <Card v-else>
    <template #content>
      <Message v-if="conflict" severity="warn" :closable="false" class="conflict">
        {{ conflict }}
        <Button label="Recargar" severity="secondary" size="small" text @click="reload" />
      </Message>
      <EmployeeForm
        ref="form"
        :key="base.version"
        :initial-values="{
          employee_number: base.employee_number,
          first_name: base.first_name,
          last_name: base.last_name,
          second_last_name: base.second_last_name,
          employment_status: base.employment_status as EmployeeStatus,
          hire_date: base.hire_date,
          termination_date: base.termination_date,
          notes: base.notes,
        }"
        :submitting="isSaving"
        @submit="save"
        @cancel="goToDetail"
      />
    </template>
  </Card>
</template>

<style scoped>
.conflict {
  margin-bottom: 1rem;
}
</style>
