<script setup lang="ts">
import Card from 'primevue/card'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import type { FormHandle } from '@/shared/design/unsaved-changes'
import PageIntro from '@/shared/design/PageIntro.vue'
import EmployeeForm from '@/features/employees/components/EmployeeForm.vue'
import { useCreateEmployee } from '@/features/employees/composables/useEmployees'
import type { EmployeeFormValues } from '@/features/employees/schemas/employee.schema'
import {
  ensureEmployeeFolder,
  filesInSharePoint,
} from '@/features/employees/services/employee-files.api'
import { DuplicateEmployeeNumberError } from '@/features/employees/services/employees.repository'

const router = useRouter()
const form = ref<FormHandle>()
const toast = useToast()
const { mutate, isPending } = useCreateEmployee()

function save(values: EmployeeFormValues) {
  mutate(values, {
    onSuccess: async ({ id }) => {
      form.value?.markSaved()
      // Guardar y publicar son resultados separados: el Excel se actualiza después.
      toast.add({
        severity: 'success',
        summary: 'Empleado guardado',
        detail: 'La publicación a Excel queda pendiente.',
        life: 4000,
      })
      if (filesInSharePoint) {
        // La persona ya quedó guardada: la carpeta se reintenta al subir su primer archivo.
        await ensureEmployeeFolder(id).catch(() =>
          toast.add({
            severity: 'warn',
            summary: 'No se creó la carpeta en SharePoint',
            detail: 'Se volverá a intentar al subir el primer archivo.',
            life: 6000,
          }),
        )
      }
      await router.push({ name: 'employee-detail', params: { id } })
    },
    onError: (error) => {
      toast.add({
        severity: 'error',
        summary: 'No se guardó el empleado',
        detail: error instanceof DuplicateEmployeeNumberError ? error.message : 'Intenta de nuevo.',
        life: 6000,
      })
    },
  })
}
</script>

<template>
  <div class="page-header">
    <h1>Nuevo empleado</h1>
  </div>
  <PageIntro
    text="Crea el registro de personal. Después podrás completar contactos, formación y documentos en su expediente."
  />
  <Card>
    <template #content>
      <EmployeeForm
        ref="form"
        :submitting="isPending"
        @submit="save"
        @cancel="router.push({ name: 'employees' })"
      />
    </template>
  </Card>
</template>
