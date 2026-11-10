<script setup lang="ts">
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

const search = defineModel<string>('search', { required: true })
defineProps<{ activeFilters: number }>()
defineEmits<{ openFilters: [] }>()
</script>

<template>
  <div class="employee-search">
    <IconField class="search-field">
      <InputIcon class="pi pi-search" />
      <InputText
        v-model.trim="search"
        fluid
        placeholder="Buscar por nombre o número"
        aria-label="Buscar empleado"
      />
    </IconField>
    <Button
      label="Filtros avanzados"
      icon="pi pi-filter"
      severity="secondary"
      :badge="activeFilters ? String(activeFilters) : undefined"
      @click="$emit('openFilters')"
    />
  </div>
</template>

<style scoped>
.employee-search {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-field {
  flex: 1 1 18rem;
}
</style>
