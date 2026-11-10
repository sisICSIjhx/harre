<script setup lang="ts">
import { refDebounced } from '@/shared/composables/refDebounced'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed, ref } from 'vue'
import EmployeeFiltersPanel from '@/features/employees/components/EmployeeFiltersPanel.vue'
import EmployeeSearch from '@/features/employees/components/EmployeeSearch.vue'
import EmployeesTable from '@/features/employees/components/EmployeesTable.vue'
import { useEmployees } from '@/features/employees/composables/useEmployees'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import PageIntro from '@/shared/design/PageIntro.vue'
import { useDesignMode } from '@/shared/design/design-mode'

const auth = useAuthStore()
const { isNext } = useDesignMode()
const list = useEmployeeListStore()
const { search } = storeToRefs(list)
const debouncedSearch = refDebounced(search, 300)
const filtersVisible = ref(false)
const isHr = computed(() => auth.hasAnyRole(['hr']))
const canSeeBankAccounts = computed(() => auth.hasAnyRole(['hr', 'payroll']))

const { data, isPending, isError, refetch } = useEmployees(
  computed(() => ({ search: debouncedSearch.value, ...list.filters })),
)
</script>

<template>
  <div class="page-header">
    <h1>Personal</h1>
    <RouterLink v-if="isHr" v-slot="{ navigate }" :to="{ name: 'employee-create' }" custom>
      <Button label="Nuevo empleado" icon="pi pi-plus" @click="navigate" />
    </RouterLink>
  </div>
  <PageIntro
    text="Encuentra a una persona y consulta su expediente. La búsqueda acepta nombre o número de empleado."
  />
  <EmployeeSearch
    v-model:search="search"
    :active-filters="list.activeFilterCount"
    @open-filters="filtersVisible = true"
  />
  <EmployeeFiltersPanel
    v-model:visible="filtersVisible"
    :is-hr="isHr"
    :can-see-bank-accounts="canSeeBankAccounts"
  />
  <div v-if="isNext" class="next-list-summary" role="status" aria-live="polite">
    <span v-if="isPending">Buscando personal…</span>
    <span v-else-if="isError">Directorio no disponible</span>
    <span v-else><strong>{{ data?.length ?? 0 }}</strong> personas en esta consulta ·
      {{ list.activeFilterCount }} filtros activos</span>
    <button v-if="search || list.activeFilterCount" type="button" @click="list.clear()">
      Restablecer vista (personal activo)
    </button>
  </div>
  <Message v-if="isError" severity="error" :closable="false">
    No fue posible cargar el directorio.
    <Button v-if="isNext" label="Volver a intentar" severity="secondary" text @click="refetch()" />
  </Message>
  <EmployeesTable v-else :employees="data" :loading="isPending" />
</template>
