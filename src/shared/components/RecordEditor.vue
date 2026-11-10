<script setup lang="ts">
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import RecordForm from '@/shared/components/RecordForm.vue'
import { emptyRecord, type RecordField } from '@/shared/lib/record-fields'
import {
  deleteRecord,
  insertRecord,
  listRecords,
  RecordError,
  updateRecord,
  type RecordRow,
} from '@/shared/lib/records'
import { formatDate, formatMoney, formatTime } from '@/shared/utils/format'
import { useDesignMode } from '@/shared/design/design-mode'
import DesignSwitcher from '@/shared/design/DesignSwitcher.vue'
import type { FormHandle } from '@/shared/design/unsaved-changes'

const props = withDefaults(
  defineProps<{
    table: string
    title?: string
    fields: readonly RecordField[]
    emptyMessage: string
    filter?: RecordRow
    orderBy?: string
    // Del más reciente al más antiguo según `orderBy`.
    descending?: boolean
    // Filtro en pantalla: a diferencia de `filter`, no se agrega a los registros nuevos.
    rowFilter?: (row: RecordRow) => boolean
    // Columnas calculadas a partir del registro; no aparecen en el formulario.
    extraColumns?: readonly { label: string; value: (row: RecordRow) => string }[]
    keyFields?: readonly string[]
    // Secciones que solo permiten cerrar con fecha, sin eliminar registros.
    deletable?: boolean
    deleteMessage?: string
    // Control documental: una sola ficha vigente por persona y tipo.
    maxRecords?: number
    // Vistas o tablas que dependen de esta, por ejemplo las opciones de contrato de otra tabla.
    related?: readonly string[]
  }>(),
  {
    title: undefined,
    filter: () => ({}),
    orderBy: 'created_at',
    descending: false,
    rowFilter: undefined,
    extraColumns: () => [],
    keyFields: () => ['id'],
    deletable: true,
    deleteMessage: '¿Eliminar este registro? Quedará constancia en el historial de cambios.',
    maxRecords: undefined,
    related: () => [],
  },
)

const auth = useAuthStore()
const { isNext } = useDesignMode()
const form = ref<FormHandle>()
const queryClient = useQueryClient()
const toast = useToast()
const confirm = useConfirm()
const canEdit = computed(() => auth.hasAnyRole(['hr']))

const queryKey = computed(() => ['records', props.table, props.filter, props.descending])
const {
  data: allRows,
  isPending,
  isError,
  refetch,
} = useQuery({
  queryKey,
  queryFn: () => listRecords(props.table, props.filter, props.orderBy, props.descending),
})
const data = computed(() =>
  props.rowFilter ? allRows.value?.filter(props.rowFilter) : allRows.value,
)

const lookupFields = props.fields.filter((field) => field.lookup)
const lookups = useQueries({
  queries: lookupFields.map((field) => ({
    queryKey: ['records', field.lookup!.table, 'options', field.lookup!.filter ?? {}],
    queryFn: () =>
      listRecords(field.lookup!.table, field.lookup!.filter ?? {}, field.lookup!.label),
  })),
})
const lookupLabels = computed(() =>
  Object.fromEntries(
    lookupFields.map((field, index) => [
      field.key,
      new Map(
        (lookups.value[index]?.data ?? []).map((row) => [
          row[field.lookup!.value ?? 'id'],
          row[field.lookup!.label],
        ]),
      ),
    ]),
  ),
)

const columns = computed(() => props.fields.filter((field) => !field.formOnly))

function display(row: RecordRow, field: RecordField): string {
  const value = row[field.key]
  if (field.lookup) return String(lookupLabels.value[field.key]?.get(value) ?? '—')
  if (field.type === 'boolean') return value ? 'Sí' : 'No'
  if (field.type === 'date') return formatDate(value as string | null)
  if (field.type === 'time') return formatTime(value as string | null)
  if (field.type === 'money') return formatMoney(value as number | null)
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

const editing = ref<RecordRow | null>(null)
const isNew = ref(false)
const dialogVisible = computed({
  get: () => editing.value !== null,
  set: async (open) => {
    if (!open && (!form.value || (await form.value.canDiscard()))) editing.value = null
  },
})

function openNew() {
  if (props.maxRecords !== undefined && (!data.value || data.value.length >= props.maxRecords))
    return
  isNew.value = true
  editing.value = emptyRecord(props.fields)
}

function openEdit(row: RecordRow) {
  isNew.value = false
  editing.value = row
}

function keyOf(row: RecordRow): RecordRow {
  return Object.fromEntries(props.keyFields.map((key) => [key, row[key]]))
}

function refresh() {
  for (const table of [props.table, ...props.related])
    void queryClient.invalidateQueries({ queryKey: ['records', table] })
  void queryClient.invalidateQueries({ queryKey: ['employees'] })
}

function showError(summary: string, error: unknown) {
  toast.add({
    severity: 'error',
    summary,
    detail: error instanceof RecordError ? error.message : 'Intenta de nuevo.',
    life: 6000,
  })
}

const save = useMutation({
  mutationFn: (values: RecordRow) =>
    isNew.value
      ? insertRecord(props.table, { ...values, ...props.filter })
      : updateRecord(props.table, keyOf(editing.value as RecordRow), values),
  onSuccess: () => {
    form.value?.markSaved()
    editing.value = null
    refresh()
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
  },
  onError: (error) => showError('No se guardó', error),
})

const remove = useMutation({
  mutationFn: (row: RecordRow) => deleteRecord(props.table, keyOf(row)),
  onSuccess: () => {
    refresh()
    toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
  },
  onError: (error) => showError('No se eliminó', error),
})

function askDelete(row: RecordRow) {
  confirm.require({
    header: 'Eliminar registro',
    message: props.deleteMessage,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', text: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: () => remove.mutate(row),
  })
}
</script>

<template>
  <section class="record-editor">
    <div class="record-header">
      <h2 v-if="title">{{ title }}</h2>
      <span v-if="isNext && !isPending && !isError" class="next-record-count">
        {{ data?.length ?? 0 }} {{ data?.length === 1 ? 'registro' : 'registros' }}
      </span>
      <Button
        v-if="canEdit && (maxRecords === undefined || (data && data.length < maxRecords))"
        class="record-add"
        label="Agregar"
        icon="pi pi-plus"
        size="small"
        severity="secondary"
        @click="openNew"
      />
    </div>
    <Message v-if="isError" severity="error" :closable="false">
      No fue posible cargar esta información.
      <Button v-if="isNext" label="Reintentar" severity="secondary" text @click="refetch()" />
    </Message>
    <DataTable v-else :value="data ?? []" :loading="isPending" scrollable size="small">
      <template #empty>{{ emptyMessage }}</template>
      <Column v-for="field in columns" :key="field.key" :header="field.label">
        <template #body="{ data: row }">
          <a
            v-if="field.type === 'url' && row[field.key]"
            :href="String(row[field.key])"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ field.linkLabel ?? 'Ver archivo' }}
          </a>
          <template v-else>{{ display(row, field) }}</template>
        </template>
      </Column>
      <Column v-for="column in extraColumns" :key="column.label" :header="column.label">
        <template #body="{ data: row }">{{ column.value(row) }}</template>
      </Column>
      <Column
        v-if="canEdit"
        :header="isNext ? 'Acciones' : ''"
        :style="{ width: isNext ? '13rem' : '6rem' }"
      >
        <template #body="{ data: row }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            aria-label="Editar"
            :label="isNext ? 'Editar' : undefined"
            @click="openEdit(row)"
          />
          <Button
            v-if="deletable"
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            aria-label="Eliminar"
            :disabled="remove.isPending.value"
            :label="isNext ? 'Eliminar' : undefined"
            @click="askDelete(row)"
          />
        </template>
      </Column>
    </DataTable>
    <Dialog
      v-model:visible="dialogVisible"
      :header="`${isNew ? 'Agregar' : 'Editar'}${isNext && title ? ` · ${title}` : ''}`"
      modal
      :style="{ width: 'min(760px, 95vw)' }"
    >
      <div class="record-dialog-design"><DesignSwitcher /></div>
      <RecordForm
        v-if="editing"
        ref="form"
        :fields="fields"
        :initial-values="editing"
        :submitting="save.isPending.value"
        cancellable
        @submit="save.mutate($event)"
        @cancel="dialogVisible = false"
      />
    </Dialog>
  </section>
</template>

<style scoped>
.record-editor {
  margin-bottom: 1.5rem;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.record-header h2 {
  font-size: 1.05rem;
  margin: 0;
}

.record-add {
  margin-left: auto;
}
</style>
