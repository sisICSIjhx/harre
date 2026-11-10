<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{ message: string; addable: boolean }>()
defineEmits<{ add: [] }>()
</script>

<template>
  <div class="lookup-empty">
    <span>{{ message }}</span>
    <Button
      v-if="addable"
      type="button"
      label="Añadir"
      icon="pi pi-plus"
      size="small"
      severity="secondary"
      @click="$emit('add')"
    />
  </div>
</template>

<style scoped>
.lookup-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
</style>
