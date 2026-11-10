<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import {
  listCandidates,
  listJobProfiles,
  listProjects,
} from '@/features/training/services/tenders.repository'
import { EMPLOYEE_STATUS_LABELS } from '@/features/employees/types/employee.types'
import PageIntro from '@/shared/design/PageIntro.vue'

const RESULTS: Record<string, { label: string; severity: string }> = {
  CUMPLE: { label: 'Cumple', severity: 'success' },
  'POR VERIFICAR': { label: 'Por verificar', severity: 'warn' },
  'NO CUMPLE': { label: 'No cumple', severity: 'danger' },
}

const jobProfileId = ref<string | null>(null)
const projectId = ref<string | null>(null)
const onlyActive = ref(true)
const onlyAssigned = ref(false)

const jobProfiles = useQuery({ queryKey: ['tenders', 'job-profiles'], queryFn: listJobProfiles })
const projects = useQuery({ queryKey: ['tenders', 'projects'], queryFn: listProjects })

const candidates = useQuery({
  queryKey: ['tenders', 'candidates', jobProfileId, projectId],
  queryFn: () => listCandidates(jobProfileId.value as string, projectId.value),
  enabled: computed(() => !!jobProfileId.value),
})

// "En integración" también es personal disponible; solo se excluyen las bajas.
const rows = computed(() =>
  (candidates.data.value ?? []).filter(
    (row) =>
      (!onlyActive.value || row.employment_status !== 'terminated') &&
      (!onlyAssigned.value || !projectId.value || row.assigned_to_project),
  ),
)
const requiredCount = computed(() => candidates.data.value?.[0]?.required_count ?? 0)
const count = (result: string) => rows.value.filter((row) => row.result === result).length
</script>

<template>
  <div class="page-header">
    <h1>Licitaciones</h1>
  </div>
  <PageIntro
    text="Revisa los cursos documentados del personal frente a los requisitos del puesto. Selecciona una licitación para acotar la consulta."
  />
  <div class="tender-filters">
    <div class="form-field">
      <label for="tender_job">Puesto a cubrir</label>
      <Select
        v-model="jobProfileId"
        input-id="tender_job"
        :options="jobProfiles.data.value ?? []"
        option-label="name"
        option-value="id"
        filter
        placeholder="Selecciona un puesto"
      />
    </div>
    <div class="form-field">
      <label for="tender_project">Licitación o proyecto</label>
      <Select
        v-model="projectId"
        input-id="tender_project"
        :options="projects.data.value ?? []"
        option-label="name"
        option-value="id"
        filter
        show-clear
        placeholder="Solo requisitos generales"
      />
    </div>
    <label class="tender-active">
      <input v-model="onlyActive" type="checkbox" />
      Sin bajas
    </label>
    <label v-if="projectId" class="tender-active">
      <input v-model="onlyAssigned" type="checkbox" />
      Solo asignados a esta licitación
    </label>
  </div>
  <Message v-if="!jobProfileId" severity="info" :closable="false">
    Elige el puesto que pide la licitación para ver quién cumple sus cursos obligatorios.
  </Message>
  <Message v-else-if="candidates.isError.value" severity="error" :closable="false">
    No fue posible consultar los candidatos.
  </Message>
  <template v-else>
    <Message
      v-if="!candidates.isPending.value && requiredCount === 0"
      severity="info"
      :closable="false"
    >
      No hay cursos obligatorios capturados para este puesto{{
        projectId ? ' en esta licitación' : ''
      }}.
    </Message>
    <p v-else class="tender-summary">
      De {{ rows.length }} personas, para <strong>{{ requiredCount }}</strong> cursos obligatorios:
      <strong>{{ count('CUMPLE') }}</strong> cumplen,
      <strong>{{ count('POR VERIFICAR') }}</strong> por verificar y
      <strong>{{ count('NO CUMPLE') }}</strong> no cumplen.
    </p>
    <DataTable :value="rows" :loading="candidates.isPending.value" scrollable size="small">
      <template #empty>Sin personas con estos criterios.</template>
      <Column field="employee_number" header="Número" />
      <Column field="full_name" header="Nombre" />
      <Column header="Estatus">
        <template #body="{ data }">
          {{ EMPLOYEE_STATUS_LABELS[data.employment_status] ?? data.employment_status }}
        </template>
      </Column>
      <Column header="Cubiertos">
        <template #body="{ data }">{{ data.covered_count }} de {{ data.required_count }}</template>
      </Column>
      <Column v-if="projectId" header="En esta licitación">
        <template #body="{ data }">{{ data.assigned_to_project ? 'Asignado' : '—' }}</template>
      </Column>
      <Column header="Resultado">
        <template #body="{ data }">
          <Tag
            v-if="RESULTS[data.result]"
            :value="RESULTS[data.result]?.label"
            :severity="RESULTS[data.result]?.severity"
          />
        </template>
      </Column>
      <Column header="Faltantes o vencidos">
        <template #body="{ data }">{{ data.missing_courses?.join(', ') || '—' }}</template>
      </Column>
      <Column header="Por verificar (sin fecha)">
        <template #body="{ data }">{{ data.pending_courses?.join(', ') || '—' }}</template>
      </Column>
    </DataTable>
  </template>
</template>

<style scoped>
.tender-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tender-active {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
}

.tender-summary {
  margin: 0 0 0.75rem;
}
</style>
