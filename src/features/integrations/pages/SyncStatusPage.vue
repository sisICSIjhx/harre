<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import {
  getSyncState,
  listRecentSyncJobs,
  requestSyncRetry,
} from '@/features/integrations/services/sync-status.repository'
import {
  publishSyncNow,
  type PublishStatus,
} from '@/features/integrations/services/sync-publish.api'
import RecordsTable from '@/shared/components/RecordsTable.vue'
import { formatDateTime } from '@/shared/utils/format'
import PageIntro from '@/shared/design/PageIntro.vue'
import { useDesignMode } from '@/shared/design/design-mode'
const { isNext } = useDesignMode()

const REFRESH_MS = 30_000
const JOB_STATUS_LABELS: Record<string, string> = {
  running: 'En proceso',
  succeeded: 'Correcta',
  failed: 'Con error',
}

const queryClient = useQueryClient()
const toast = useToast()

const state = useQuery({
  queryKey: ['sync', 'state'],
  queryFn: getSyncState,
  refetchInterval: REFRESH_MS,
})
const jobs = useQuery({
  queryKey: ['sync', 'jobs'],
  queryFn: listRecentSyncJobs,
  refetchInterval: REFRESH_MS,
})

const retry = useMutation({
  mutationFn: () => requestSyncRetry(state.data.value?.target ?? ''),
  onSuccess: () => {
    toast.add({ severity: 'success', summary: 'Reintento solicitado', life: 4000 })
    return queryClient.invalidateQueries({ queryKey: ['sync'] })
  },
  onError: () =>
    toast.add({ severity: 'error', summary: 'No se solicitó el reintento', life: 5000 }),
})

const PUBLISH_MESSAGES: Record<
  PublishStatus,
  { severity: 'success' | 'info' | 'warn' | 'error'; summary: string }
> = {
  published: { severity: 'success', summary: 'Excel publicado' },
  up_to_date: { severity: 'info', summary: 'El Excel ya está al día' },
  in_progress: {
    severity: 'warn',
    summary: 'Hay una publicación en curso; intenta en unos minutos',
  },
  disabled: { severity: 'warn', summary: 'La publicación está desactivada en este entorno' },
  failed: { severity: 'error', summary: 'No se pudo publicar; revisa el estado' },
}

const publish = useMutation({
  mutationFn: publishSyncNow,
  onSuccess: (status) => toast.add({ ...PUBLISH_MESSAGES[status], life: 5000 }),
  onError: () => toast.add({ ...PUBLISH_MESSAGES.failed, life: 5000 }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['sync'] }),
})

const pendingChanges = computed(() => {
  const value = state.data.value
  return value ? value.pending_revision - value.published_revision : 0
})

const summary = computed(() => {
  const value = state.data.value
  if (!value) return { label: 'Sin datos', severity: 'secondary' }
  if (value.lease_expires_at && new Date(value.lease_expires_at) > new Date()) {
    return { label: 'Procesando', severity: 'info' }
  }
  if (value.last_error) return { label: 'Con error', severity: 'danger' }
  if (pendingChanges.value > 0) return { label: 'Cambios pendientes', severity: 'warn' }
  return { label: 'Al día', severity: 'success' }
})

const nextAction = computed(() => {
  const value = state.data.value
  if (!value || pendingChanges.value === 0) return 'Ninguna'
  if (value.next_attempt_at === 'infinity') return 'Requiere revisión y reintento manual'
  if (value.next_attempt_at) return `Reintento: ${formatDateTime(value.next_attempt_at)}`
  return 'Publicación en la siguiente ejecución programada'
})

const jobRows = computed(() =>
  jobs.data.value?.map((job) => ({
    ...job,
    status_label: JOB_STATUS_LABELS[job.status] ?? job.status,
    started_label: formatDateTime(job.started_at),
    finished_label: formatDateTime(job.finished_at),
  })),
)
</script>

<template>
  <div class="page-header">
    <h1>Sincronización con SharePoint</h1>
    <div class="sync-actions">
      <Button
        v-if="state.data.value?.last_error"
        label="Reintentar"
        icon="pi pi-refresh"
        severity="secondary"
        :loading="retry.isPending.value"
        @click="retry.mutate()"
      />
      <Button
        label="Publicar ahora"
        icon="pi pi-upload"
        :loading="publish.isPending.value"
        :disabled="publish.isPending.value"
        @click="publish.mutate()"
      />
    </div>
  </div>
  <PageIntro
    text="Da seguimiento a la publicación del Excel de RRHH en SharePoint y consulta las ejecuciones recientes."
  />
  <div v-if="isNext" class="next-process-note">
    <i class="pi pi-info-circle" aria-hidden="true" />
    <div>
      <strong>Guardar y publicar son pasos distintos</strong>
      <p>
        Los cambios se guardan primero en el sistema. El Excel de SharePoint se actualiza después;
        un error de publicación no elimina los datos guardados.
      </p>
    </div>
  </div>
  <Message v-if="state.isError.value" severity="error" :closable="false">
    No fue posible consultar el estado de sincronización.
  </Message>
  <Message v-else-if="isNext && state.isPending.value" severity="info" :closable="false">
    Consultando el estado de publicación…
  </Message>
  <Message v-else-if="isNext && !state.data.value" severity="info" :closable="false">
    Aún no hay un estado de publicación disponible. Solicita a Sistemas revisar la configuración.
  </Message>
  <Card v-else class="sync-card">
    <template #content>
      <dl class="sync-summary">
        <div>
          <dt class="muted">Estado</dt>
          <dd><Tag :value="summary.label" :severity="summary.severity" /></dd>
        </div>
        <div>
          <dt class="muted">Última sincronización correcta</dt>
          <dd>{{ formatDateTime(state.data.value?.last_success_at) }}</dd>
        </div>
        <div>
          <dt class="muted">Cambios pendientes</dt>
          <dd>{{ pendingChanges }}</dd>
        </div>
        <div>
          <dt class="muted">Próxima acción</dt>
          <dd>{{ nextAction }}</dd>
        </div>
      </dl>
      <Message v-if="state.data.value?.last_error" severity="error" :closable="false">
        {{ state.data.value.last_error }}
      </Message>
    </template>
  </Card>
  <h2>Ejecuciones recientes</h2>
  <RecordsTable
    :rows="jobRows"
    :loading="jobs.isPending.value"
    :error="jobs.isError.value"
    empty-message="Aún no hay ejecuciones."
    :columns="[
      { field: 'status_label', header: 'Resultado' },
      { field: 'attempt', header: 'Intento' },
      { field: 'revision', header: 'Revisión' },
      { field: 'started_label', header: 'Inicio' },
      { field: 'finished_label', header: 'Fin' },
      { field: 'error_summary', header: 'Error' },
    ]"
  />
</template>

<style scoped>
.sync-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sync-card {
  margin-bottom: 1.5rem;
}

.sync-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 0 0 1rem;
}

dd {
  margin: 0.25rem 0 0;
}

h2 {
  font-size: 1.1rem;
}
</style>
