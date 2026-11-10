<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch } from 'vue'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Popover from 'primevue/popover'
import {
  formatDate,
  fromCalendarDate,
  isIsoDate,
  parseDisplayDate,
  toCalendarDate,
} from '@/shared/utils/format'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  modelValue?: string | null
  invalid?: boolean
  validOnly?: boolean
  calendarLabel?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()
const attrs = useAttrs()
const errorId = `${useId()}-date-error`
const text = ref('')
const touched = ref(false)
const calendar = ref<InstanceType<typeof Popover>>()
const calendarButton = ref<HTMLButtonElement>()
const control = ref<HTMLDivElement>()
const calendarOpen = ref(false)
watch(
  () => props.modelValue,
  (value) => {
    text.value = value && isIsoDate(value) ? formatDate(value) : (value ?? '')
  },
  { immediate: true },
)
const invalidDate = computed(() => !!text.value && !parseDisplayDate(text.value))
const showError = computed(() => invalidDate.value && touched.value && !props.invalid)
const calendarValue = computed(() => toCalendarDate(parseDisplayDate(text.value)))
function input(value: string | undefined) {
  text.value = value ?? ''
  const iso = parseDisplayDate(text.value)
  if (!text.value || iso) emit('update:modelValue', iso)
  else if (!props.validOnly) emit('update:modelValue', text.value)
}
function pick(date: Date) {
  text.value = formatDate(fromCalendarDate(date))
  emit('update:modelValue', fromCalendarDate(date))
  // Mantiene los avisos de cambio de los formularios contenedores, también al elegir en el calendario.
  control.value?.dispatchEvent(new Event('change', { bubbles: true }))
  calendar.value?.hide()
  calendarButton.value?.focus()
}
</script>

<template>
  <div ref="control" class="date-input">
    <div class="date-input-control">
      <InputText
        v-bind="attrs"
        :model-value="text"
        placeholder="DD/MM/AAAA"
        inputmode="numeric"
        maxlength="10"
        :invalid="invalid || invalidDate"
        :aria-invalid="invalid || invalidDate"
        :aria-describedby="
          [attrs['aria-describedby'], showError ? errorId : undefined].filter(Boolean).join(' ') ||
            undefined
        "
        @update:model-value="input"
        @blur="touched = true"
      />
      <button
        ref="calendarButton"
        type="button"
        class="date-calendar-button"
        :aria-label="`Abrir calendario${calendarLabel || attrs['aria-label'] ? `: ${calendarLabel || attrs['aria-label']}` : ''}`"
        aria-haspopup="dialog"
        :aria-expanded="calendarOpen"
        @click="calendar?.toggle($event)"
      >
        <i class="pi pi-calendar" aria-hidden="true" />
      </button>
    </div>
    <small v-if="showError" :id="errorId" class="form-error" role="alert">Usa una fecha válida en formato DD/MM/AAAA.</small>
    <Popover
      ref="calendar"
      class="date-calendar-popover"
      @show="calendarOpen = true"
      @hide="calendarOpen = false"
    >
      <DatePicker :model-value="calendarValue" inline date-format="dd/mm/yy" @date-select="pick" />
    </Popover>
  </div>
</template>

<style scoped>
.date-input {
  min-width: 0;
  width: 100%;
}
.date-input-control {
  display: flex;
  align-items: stretch;
  min-width: 0;
}
.date-input-control :deep(input) {
  min-width: 0;
  width: 100%;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.date-calendar-button {
  flex: 0 0 36px;
  border: 1px solid var(--p-inputtext-border-color, #aabbb1);
  border-left: 0;
  border-radius: 0 4px 4px 0;
  background: var(--p-inputtext-background, #fff);
  color: var(--p-inputtext-color, #1f2933);
  cursor: pointer;
}
.date-calendar-button:hover {
  background: var(--p-content-hover-background, #f3f5f4);
}
.date-calendar-button:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
</style>

<style>
/* Popover se teletransporta fuera del componente: se limita por su clase exclusiva. */
.date-calendar-popover {
  width: min(340px, calc(100vw - 16px));
}
.date-calendar-popover .p-popover-content {
  padding: 8px;
}
.date-calendar-popover .p-datepicker,
.date-calendar-popover .p-datepicker-panel {
  min-width: 0;
  width: 100%;
}
.date-calendar-popover .p-datepicker-panel {
  padding: 8px;
}
.date-calendar-popover .p-datepicker-day {
  width: 30px;
  height: 30px;
}
</style>
