<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import {
  createDocumentUrl,
  getEmployeePhoto,
  photoProblem,
  uploadEmployeePhoto,
} from '@/features/employees/services/employees.repository'

const props = defineProps<{ employeeId: string; employeeNumber: string }>()

const queryClient = useQueryClient()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const problem = ref<string | null>(null)

// La URL firmada caduca pronto: no se conserva en caché ni se renueva sin necesidad.
const photo = useQuery({
  queryKey: ['employees', 'photo', computed(() => props.employeeId)],
  queryFn: () => getEmployeePhoto(props.employeeId),
  gcTime: 0,
  refetchOnWindowFocus: false,
})

const upload = useMutation({
  mutationFn: (file: File) => uploadEmployeePhoto(props.employeeId, file),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['employees', 'photo'] })
    void queryClient.invalidateQueries({ queryKey: ['employees', 'files'] })
    toast.add({ severity: 'success', summary: 'Foto guardada', life: 3000 })
  },
  onError: () => toast.add({ severity: 'error', summary: 'No se guardó la foto', life: 6000 }),
})

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Permite volver a elegir el mismo archivo.
  input.value = ''
  if (!file) return
  problem.value = photoProblem(file)
  if (!problem.value) upload.mutate(file)
}

async function download() {
  const current = photo.data.value
  if (!current) return
  const extension = current.mime_type === 'image/png' ? 'png' : 'jpg'
  try {
    window.location.assign(
      await createDocumentUrl(current, `${props.employeeNumber}_foto.${extension}`),
    )
  } catch {
    toast.add({ severity: 'error', summary: 'No fue posible descargar la foto', life: 5000 })
  }
}
</script>

<template>
  <div class="employee-photo">
    <div class="frame">
      <img v-if="photo.data.value" :src="photo.data.value.url" alt="Foto del empleado" />
      <i v-else class="pi pi-user" aria-hidden="true" />
    </div>
    <small v-if="photo.isError.value" class="form-error">No fue posible cargar la foto.</small>
    <small v-if="problem" class="form-error">{{ problem }}</small>
    <input
      ref="fileInput"
      class="file-input"
      type="file"
      accept="image/jpeg,image/png"
      aria-label="Elegir foto del empleado"
      @change="selectFile"
    />
    <Button
      v-if="photo.data.value"
      label="Descargar"
      icon="pi pi-download"
      severity="secondary"
      size="small"
      @click="download"
    />
    <Button
      :label="photo.data.value ? 'Cambiar foto' : 'Subir foto'"
      icon="pi pi-upload"
      severity="secondary"
      size="small"
      text
      :loading="upload.isPending.value"
      :disabled="photo.isPending.value"
      @click="fileInput?.click()"
    />
  </div>
</template>

<style scoped>
.employee-photo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 10rem;
  flex-shrink: 0;
}

.frame {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
  background: var(--p-content-hover-background);
}

.frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.frame .pi {
  font-size: 3rem;
  color: var(--p-text-muted-color);
}

.file-input {
  display: none;
}
</style>
