<script setup lang="ts">
import { useId } from 'vue'
import { useDesignMode } from './design-mode'
defineProps<{
  items: readonly { value: string; label: string }[]
  label: string
}>()
const selected = defineModel<string>({ required: true })
const { isNext } = useDesignMode()
const selectId = useId()
function selectSection(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value
  // La sección visible sigue siendo la actual mientras se confirma descartar un borrador.
  select.value = selected.value
  selected.value = value
}
</script>
<template>
  <nav v-if="isNext" class="next-section-toolbar" :aria-label="label">
    <label :for="selectId">{{ label }}</label>
    <select :id="selectId" :value="selected" @change="selectSection">
      <option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
  </nav>
</template>
