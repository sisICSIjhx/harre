<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import { computed } from 'vue'
import { formatDate } from '@/shared/utils/format'

export interface RecordColumn {
  field: string
  header: string
  kind?: 'text' | 'date' | 'boolean'
}

const props = defineProps<{
  columns: RecordColumn[]
  rows: readonly object[] | undefined
  loading?: boolean
  error?: boolean
  emptyMessage: string
}>()

const rows = computed(() => [...(props.rows ?? [])])

function display(row: Record<string, unknown>, column: RecordColumn): string {
  const value = row[column.field]
  if (column.kind === 'date') return formatDate(value as string | null)
  if (column.kind === 'boolean') return value ? 'Sí' : 'No'
  return value === null || value === undefined || value === '' ? '—' : String(value)
}
</script>

<template>
  <Message v-if="error" severity="error" :closable="false">
    No fue posible cargar esta información.
  </Message>
  <DataTable v-else :value="rows" :loading="loading" scrollable>
    <template #empty>{{ emptyMessage }}</template>
    <Column v-for="column in columns" :key="column.field" :header="column.header">
      <template #body="{ data }">{{ display(data, column) }}</template>
    </Column>
  </DataTable>
</template>
