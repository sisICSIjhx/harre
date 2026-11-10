<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { filesInSharePoint } from '@/features/employees/services/employee-files.api'
import {
  createDocumentUrl,
  fileProblem,
  listEmployeeDocuments,
  uploadEmployeeDocument,
} from '@/features/employees/services/employees.repository'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import type { RecordField } from '@/shared/lib/record-fields'
import type { Database } from '@/shared/types/database.types'
import { formatDateTime } from '@/shared/utils/format'
import { useDesignMode } from '@/shared/design/design-mode'
import { useUnsavedChanges } from '@/shared/design/unsaved-changes'
const { isNext } = useDesignMode()

type EmployeeFile = Database['public']['Tables']['employee_documents']['Row']

const props = defineProps<{ employeeId: string }>()

const queryClient = useQueryClient()
const toast = useToast()

const checklistFields: RecordField[] = [
  {
    key: 'document_type_id',
    label: 'Documento',
    type: 'lookup',
    required: true,
    lookup: { table: 'document_types', label: 'name' },
  },
  {
    key: 'manual_decision',
    label: '¿Aplica a esta persona?',
    type: 'select',
    required: true,
    options: ['Requerido', 'No aplica', 'Opcional'],
    initial: 'Requerido',
  },
  {
    key: 'review_status',
    label: 'Revisión',
    type: 'select',
    required: true,
    options: ['Sin revisar', 'Recibido', 'Validado', 'Rechazado'],
    initial: 'Sin revisar',
  },
  { key: 'received_on', label: 'Recibido', type: 'date' },
  { key: 'issued_on', label: 'Emisión', type: 'date', formOnly: true },
  { key: 'expires_on', label: 'Vencimiento', type: 'date' },
  { key: 'validated_by', label: 'Validado por', formOnly: true },
  { key: 'document_url', label: 'Link del documento', type: 'url', linkLabel: 'Ver documento' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]

const documentType = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const problem = computed(() => (selectedFile.value ? fileProblem(selectedFile.value) : null))

const { data, isPending, isError } = useQuery({
  queryKey: ['employees', 'files', computed(() => props.employeeId)],
  queryFn: () => listEmployeeDocuments(props.employeeId),
})

function selectFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

const upload = useMutation({
  mutationFn: () =>
    uploadEmployeeDocument(props.employeeId, documentType.value.trim(), selectedFile.value as File),
  onSuccess: () => {
    documentType.value = ''
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    void queryClient.invalidateQueries({ queryKey: ['employees', 'files'] })
    toast.add({ severity: 'success', summary: 'Archivo guardado', life: 3000 })
  },
  onError: () => toast.add({ severity: 'error', summary: 'No se guardó el archivo', life: 6000 }),
})
useUnsavedChanges(
  () => !!selectedFile.value || !!documentType.value,
  () => upload.isPending.value,
)

// En SharePoint abre su página, sujeta a sus permisos; en el bucket privado, una URL firmada.
async function openFile(row: EmployeeFile) {
  try {
    window.open(row.web_url ?? (await createDocumentUrl(row)), '_blank', 'noopener')
  } catch {
    toast.add({ severity: 'error', summary: 'No fue posible abrir el archivo', life: 5000 })
  }
}
</script>

<template>
  <RecordEditor
    table="employee_document_checklist"
    title="Control de documentos"
    :fields="checklistFields"
    :filter="{ employee_id: employeeId, is_current: true }"
    empty-message="Aún no hay documentos registrados en el control."
  />
  <h2>Archivos</h2>
  <p v-if="isNext" class="muted">
    Adjunta la evidencia y abre los archivos con los permisos de tu cuenta. El control de documentos
    se registra por separado.
  </p>
  <p v-if="filesInSharePoint" class="muted">
    Se guardan en la carpeta del expediente en SharePoint.
  </p>
  <form class="file-form" @submit.prevent="upload.mutate()">
    <div class="form-field">
      <label for="document_type">Tipo de documento</label>
      <InputText id="document_type" v-model="documentType" />
    </div>
    <div class="form-field">
      <label for="document_file">Archivo (PDF, JPG o PNG; máximo 10 MB)</label>
      <input
        id="document_file"
        ref="fileInput"
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        @change="selectFile"
      />
      <small v-if="problem" class="form-error">{{ problem }}</small>
    </div>
    <Button
      type="submit"
      label="Subir"
      icon="pi pi-upload"
      severity="secondary"
      :loading="upload.isPending.value"
      :disabled="!selectedFile || !!problem || !documentType.trim()"
    />
    <small v-if="isNext" class="next-file-help" role="status">{{
      upload.isPending.value
        ? 'Subiendo archivo…'
        : selectedFile
          ? `Seleccionado: ${selectedFile.name}`
          : 'Escribe el tipo de documento y selecciona un archivo para habilitar Subir.'
    }}</small>
  </form>
  <Message v-if="isError" severity="error" :closable="false">
    No fue posible cargar los archivos.
  </Message>
  <p v-if="isNext" class="muted">Descarga: próximamente disponible.</p>
  <DataTable v-if="!isError" :value="data ?? []" :loading="isPending" scrollable size="small">
    <template #empty>Sin archivos.</template>
    <Column field="document_type" header="Tipo" />
    <Column field="original_filename" header="Archivo" />
    <Column header="Cargado">
      <template #body="{ data: row }">{{ formatDateTime(row.created_at) }}</template>
    </Column>
    <Column header="Acciones">
      <template #body="{ data: row }">
        <Button
          label="Abrir"
          icon="pi pi-external-link"
          severity="secondary"
          text
          @click="openFile(row)"
        />
        <Button
          v-if="isNext"
          label="Descargar"
          icon="pi pi-download"
          severity="secondary"
          text
          aria-disabled="true"
          :aria-label="'Descargar ' + row.original_filename + ': próximamente'"
          title="Descarga próximamente disponible"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
h2 {
  font-size: 1.05rem;
}

.file-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}
</style>
