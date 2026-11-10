<script setup lang="ts">
import { useMutation, useQueries, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import DateInput from '@/shared/components/DateInput.vue'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useForm } from 'vee-validate'
import { computed, nextTick, ref, useId, watch, type ComponentPublicInstance } from 'vue'
import LookupEmpty from '@/shared/components/LookupEmpty.vue'
import { CATALOG_FIELDS } from '@/shared/lib/catalog-fields'
import { toFormSchema } from '@/shared/lib/form-schema'
import {
  emptyRecord,
  isFieldVisible,
  recordSchema,
  withoutHiddenValues,
  type RecordField,
} from '@/shared/lib/record-fields'
import { createRecord, listRecords, RecordError, type RecordRow } from '@/shared/lib/records'
import { useDesignMode } from '@/shared/design/design-mode'
import { useUnsavedChanges, type FormHandle } from '@/shared/design/unsaved-changes'
import DesignSwitcher from '@/shared/design/DesignSwitcher.vue'

const props = defineProps<{
  fields: readonly RecordField[]
  initialValues: RecordRow
  submitting: boolean
  submitLabel?: string
  cancellable?: boolean
}>()
const emit = defineEmits<{ submit: [values: RecordRow]; cancel: [] }>()

const { values, errors, submitCount, setFieldValue, handleSubmit, meta, resetForm } =
  useForm<RecordRow>({
    validationSchema: toFormSchema(recordSchema(props.fields)) as never,
    initialValues: props.initialValues,
  })
const formId = useId()
const { isNext } = useDesignMode()
const { canDiscard } = useUnsavedChanges(
  () => meta.value.dirty,
  () => props.submitting,
)
function markSaved() {
  resetForm({ values: { ...values } })
}
defineExpose({ canDiscard, markSaved })
const nestedForm = ref<FormHandle>()

const lookupFields = props.fields.filter((field) => field.lookup)
const lookups = useQueries({
  queries: lookupFields.map((field) => ({
    queryKey: ['records', field.lookup!.table, 'options', field.lookup!.filter ?? {}],
    queryFn: () =>
      listRecords(field.lookup!.table, field.lookup!.filter ?? {}, field.lookup!.label),
  })),
})
const options = computed(() =>
  Object.fromEntries(
    lookupFields.map((field, index) => [
      field.key,
      (lookups.value[index]?.data ?? []).map((row) => ({
        label: String(row[field.lookup!.label]),
        value: row[field.lookup!.value ?? 'id'],
      })),
    ]),
  ),
)

// Los errores aparecen hasta el primer intento de guardar, no al abrir el formulario.
const fieldError = (key: string) =>
  submitCount.value > 0 ? (errors.value as Record<string, string | undefined>)[key] : undefined
const textValue = (key: string) => values[key] as string | null
const numberValue = (key: string) => values[key] as number | null
// En una constante: vue-tsc confunde las dos diagonales dentro de la plantilla con un comentario.
const URL_PLACEHOLDER = 'https://'
// Campos condicionados a otros valores: al ocultarse se vacían para no guardar datos que no aplican.
const visibleFields = computed(() => props.fields.filter((field) => isFieldVisible(field, values)))
watch(
  () => props.fields.filter((field) => !isFieldVisible(field, values)).map((field) => field.key),
  (hidden) => hidden.forEach((key) => values[key] != null && setFieldValue(key, null)),
)
const submit = handleSubmit(
  (result) => emit('submit', withoutHiddenValues(props.fields, result) as RecordRow),
  ({ errors }) =>
    nextTick(() => document.getElementById(`${formId}-${Object.keys(errors)[0] ?? ''}`)?.focus()),
)

// Alta en el catálogo sin salir del formulario, con todos los campos que pide su propia vista.
const queryClient = useQueryClient()
const toast = useToast()
const searchText: Record<string, string> = {}
const selects: Record<string, ComponentPublicInstance | null> = {}
const adding = ref<{
  field: RecordField
  fields: readonly RecordField[]
  values: RecordRow
} | null>(null)
const addingVisible = computed({
  get: () => adding.value !== null,
  set: async (open) => {
    if (!open && (!nestedForm.value || (await nestedForm.value.canDiscard()))) adding.value = null
  },
})

const catalogFieldsOf = (field: RecordField) =>
  field.lookup ? CATALOG_FIELDS[field.lookup.table] : undefined

function startAdding(field: RecordField) {
  const fields = catalogFieldsOf(field)
  if (!fields) return
  const values = { ...emptyRecord(fields), [field.lookup!.label]: searchText[field.key] || null }
  ;(selects[field.key] as unknown as { hide: () => void } | null)?.hide()
  adding.value = { field, fields, values }
}

const addToCatalog = useMutation({
  mutationFn: (values: RecordRow) => createRecord(adding.value!.field.lookup!.table, values),
  onSuccess: (row) => {
    nestedForm.value?.markSaved()
    const { field } = adding.value!
    const { table, value, filter } = field.lookup!
    // Se agrega a las opciones de inmediato para que el campo muestre el nombre recién creado.
    queryClient.setQueryData<RecordRow[]>(['records', table, 'options', filter ?? {}], (rows) => [
      ...(rows ?? []),
      row,
    ])
    void queryClient.invalidateQueries({ queryKey: ['records', table] })
    setFieldValue(field.key, row[value ?? 'id'])
    adding.value = null
    toast.add({ severity: 'success', summary: 'Agregado al catálogo', life: 3000 })
  },
  onError: (error) =>
    toast.add({
      severity: 'error',
      summary: 'No se agregó al catálogo',
      detail: error instanceof RecordError ? error.message : 'Intenta de nuevo.',
      life: 6000,
    }),
})
</script>

<template>
  <form class="form-stack" novalidate @submit.prevent="submit">
    <p v-if="isNext && fields.some((field) => field.required)" class="muted">
      Los campos con * son obligatorios.
    </p>
    <div class="form-grid">
      <template v-for="field in visibleFields" :key="field.key">
        <div class="form-field" :class="{ 'form-field-wide': field.type === 'textarea' }">
          <label :for="`${formId}-${field.key}`">
            {{ field.label }}{{ field.required ? ' *' : '' }}
          </label>
          <div v-if="field.type === 'boolean'" class="form-check">
            <Checkbox
              :input-id="`${formId}-${field.key}`"
              binary
              :model-value="!!values[field.key]"
              @update:model-value="setFieldValue(field.key, $event)"
            />
          </div>
          <Select
            v-else-if="field.type === 'select' || field.type === 'lookup'"
            :ref="(select) => (selects[field.key] = select as ComponentPublicInstance | null)"
            :input-id="`${formId}-${field.key}`"
            :model-value="values[field.key]"
            :options="field.type === 'select' ? [...(field.options ?? [])] : options[field.key]"
            :option-label="field.type === 'select' ? undefined : 'label'"
            :option-value="field.type === 'select' ? undefined : 'value'"
            :filter="field.type === 'lookup'"
            :show-clear="!field.required"
            :invalid="!!fieldError(field.key)"
            :aria-invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            reset-filter-on-hide
            placeholder="Selecciona"
            @filter="searchText[field.key] = $event.value"
            @update:model-value="setFieldValue(field.key, $event)"
          >
            <template #emptyfilter>
              <LookupEmpty
                message="Sin resultados"
                :addable="!!catalogFieldsOf(field)"
                @add="startAdding(field)"
              />
            </template>
            <template #empty>
              <LookupEmpty
                message="Sin opciones"
                :addable="!!catalogFieldsOf(field)"
                @add="startAdding(field)"
              />
            </template>
          </Select>
          <InputNumber
            v-else-if="field.type === 'number'"
            :input-id="`${formId}-${field.key}`"
            :model-value="numberValue(field.key)"
            :use-grouping="false"
            :invalid="!!fieldError(field.key)"
            :aria-invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            @update:model-value="setFieldValue(field.key, $event)"
          />
          <InputNumber
            v-else-if="field.type === 'money'"
            :input-id="`${formId}-${field.key}`"
            :model-value="numberValue(field.key)"
            mode="currency"
            currency="MXN"
            locale="es-MX"
            :min="0"
            :invalid="!!fieldError(field.key)"
            :aria-invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            @update:model-value="setFieldValue(field.key, $event)"
          />
          <!-- La base devuelve HH:mm:ss; el control nativo muestra y captura HH:mm. -->
          <InputText
            v-else-if="field.type === 'time'"
            :id="`${formId}-${field.key}`"
            type="time"
            :model-value="textValue(field.key)?.slice(0, 5) ?? null"
            :invalid="!!fieldError(field.key)"
            :aria-invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            @update:model-value="setFieldValue(field.key, $event || null)"
          />
          <Textarea
            v-else-if="field.type === 'textarea'"
            :id="`${formId}-${field.key}`"
            :model-value="textValue(field.key)"
            rows="2"
            auto-resize
            @update:model-value="setFieldValue(field.key, $event)"
          />
          <DateInput
            v-else-if="field.type === 'date'"
            :id="`${formId}-${field.key}`"
            :calendar-label="field.label"
            :model-value="textValue(field.key)"
            :invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            @update:model-value="setFieldValue(field.key, $event)"
          />
          <InputText
            v-else
            :id="`${formId}-${field.key}`"
            :type="field.type === 'url' ? 'url' : 'text'"
            :placeholder="field.type === 'url' ? URL_PLACEHOLDER : undefined"
            :inputmode="field.type === 'clabe' ? 'numeric' : undefined"
            :maxlength="field.type === 'clabe' ? 18 : undefined"
            :model-value="textValue(field.key)"
            :invalid="!!fieldError(field.key)"
            :aria-invalid="!!fieldError(field.key)"
            :aria-describedby="fieldError(field.key) ? `${formId}-${field.key}-error` : undefined"
            @update:model-value="setFieldValue(field.key, $event)"
          />
          <small
            v-if="fieldError(field.key)"
            :id="`${formId}-${field.key}-error`"
            role="alert"
            class="form-error"
          >
            {{ fieldError(field.key) }}
          </small>
          <small v-else-if="field.hint" class="muted">{{ field.hint }}</small>
        </div>
      </template>
    </div>
    <div class="form-actions">
      <p v-if="isNext" class="next-form-state" role="status">
        {{
          submitting ? 'Guardando…' : meta.dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'
        }}
      </p>
      <Button
        v-if="cancellable"
        type="button"
        label="Cancelar"
        severity="secondary"
        text
        @click="emit('cancel')"
      />
      <Button
        type="submit"
        :label="submitLabel ?? (isNext ? 'Guardar cambios' : 'Guardar')"
        icon="pi pi-check"
        :loading="submitting"
      />
    </div>
  </form>
  <Dialog
    v-model:visible="addingVisible"
    :header="adding ? `Añadir ${adding.field.label.toLowerCase()}` : ''"
    modal
    :style="{ width: 'min(760px, 95vw)' }"
  >
    <DesignSwitcher />
    <RecordForm
      v-if="adding"
      ref="nestedForm"
      :fields="adding.fields"
      :initial-values="adding.values"
      :submitting="addToCatalog.isPending.value"
      cancellable
      @submit="addToCatalog.mutate($event)"
      @cancel="addingVisible = false"
    />
  </Dialog>
</template>

<style scoped>
.form-check {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}

.form-field-wide {
  grid-column: 1 / -1;
}
</style>
