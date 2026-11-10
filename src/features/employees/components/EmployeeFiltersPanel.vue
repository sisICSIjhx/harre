<script setup lang="ts">
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Drawer from 'primevue/drawer'
import DateInput from '@/shared/components/DateInput.vue'
import MultiSelect from 'primevue/multiselect'
import { computed, ref } from 'vue'
import { useEmployeeFilterOptions } from '@/features/employees/composables/useEmployees'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'
import {
  EMPLOYEE_COLUMNS,
  EMPLOYEE_STATUS_LABELS,
  type EmployeeColumnKey,
} from '@/features/employees/types/employee.types'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{ isHr: boolean; canSeeBankAccounts: boolean }>()

const list = useEmployeeListStore()
const dateInputsVersion = ref(0)
function resetFilters() {
  list.reset()
  dateInputsVersion.value++
}
const { data: options } = useEmployeeFilterOptions()

const statusOptions = Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))
const columns = computed(() => EMPLOYEE_COLUMNS.filter((column) => props.isHr || !column.hrOnly))
const isShown = (column: EmployeeColumnKey) => list.columns.includes(column)
</script>

<template>
  <Drawer
    v-model:visible="visible"
    header="Filtros avanzados"
    position="right"
    :modal="false"
    :dismissable="false"
    :style="{ width: 'min(26rem, 100vw)' }"
  >
    <p class="muted hint">
      Marca una casilla para mostrar esa columna en la tabla. Al filtrar por un dato, su columna se
      muestra; al quitarla, se quita también su filtro.
    </p>

    <div class="filter-row">
      <label class="filter-label">
        <Checkbox binary :model-value="true" disabled aria-label="Nombre siempre visible" />
        Nombre
      </label>
      <small class="muted">Siempre visible. Se busca con la barra de búsqueda.</small>
    </div>

    <div class="filter-row">
      <label class="filter-label">
        <Checkbox binary :model-value="true" disabled aria-label="Estatus siempre visible" />
        Estatus
      </label>
      <MultiSelect
        v-model="list.filters.statuses"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Todos los estatus"
        aria-label="Filtrar por estatus"
        fluid
      />
    </div>

    <div v-for="column in columns" :key="column.key" class="filter-row">
      <label class="filter-label">
        <Checkbox
          binary
          :model-value="isShown(column.key)"
          :aria-label="`Mostrar columna ${column.label}`"
          @update:model-value="list.toggleColumn(column.key, $event)"
        />
        {{ column.label }}
      </label>
      <MultiSelect
        v-if="column.key === 'job_profile_name'"
        :model-value="list.filters.jobProfiles"
        :options="options?.jobProfiles ?? []"
        filter
        placeholder="Todos los puestos"
        aria-label="Filtrar por puesto"
        fluid
        @update:model-value="list.setFilter(column.key, 'jobProfiles', $event)"
      />
      <MultiSelect
        v-else-if="column.key === 'project_name'"
        :model-value="list.filters.projects"
        :options="options?.projects ?? []"
        filter
        placeholder="Todos los proyectos"
        aria-label="Filtrar por proyecto"
        fluid
        @update:model-value="list.setFilter(column.key, 'projects', $event)"
      />
      <MultiSelect
        v-else-if="column.key === 'site'"
        :model-value="list.filters.sites"
        :options="options?.sites ?? []"
        filter
        placeholder="Todas las ubicaciones"
        aria-label="Filtrar por ubicación"
        fluid
        @update:model-value="list.setFilter(column.key, 'sites', $event)"
      />
      <div v-else-if="column.key === 'hire_date'" :key="dateInputsVersion" class="date-range">
        <DateInput
          valid-only
          :model-value="list.filters.hireFrom"
          aria-label="Alta desde"
          @update:model-value="list.setFilter(column.key, 'hireFrom', $event || null)"
        />
        <DateInput
          valid-only
          :model-value="list.filters.hireTo"
          aria-label="Alta hasta"
          @update:model-value="list.setFilter(column.key, 'hireTo', $event || null)"
        />
      </div>
      <div v-else :key="dateInputsVersion" class="date-range">
        <DateInput
          valid-only
          :model-value="list.filters.terminationFrom"
          aria-label="Baja desde"
          @update:model-value="list.setFilter(column.key, 'terminationFrom', $event || null)"
        />
        <DateInput
          valid-only
          :model-value="list.filters.terminationTo"
          aria-label="Baja hasta"
          @update:model-value="list.setFilter(column.key, 'terminationTo', $event || null)"
        />
      </div>
    </div>

    <div v-if="canSeeBankAccounts" class="filter-row">
      <label class="filter-label">
        <Checkbox v-model="list.filters.withoutPayrollAccount" binary />
        Sin cuenta de nómina
      </label>
      <small class="muted">Solo personas activas que no tienen cuenta de tipo Nómina.</small>
    </div>

    <Button
      label="Restablecer"
      icon="pi pi-refresh"
      severity="secondary"
      text
      @click="resetFilters"
    />
  </Drawer>
</template>

<style scoped>
.hint {
  margin-top: 0;
  font-size: 0.875rem;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.date-range input {
  min-width: 0;
}
</style>
