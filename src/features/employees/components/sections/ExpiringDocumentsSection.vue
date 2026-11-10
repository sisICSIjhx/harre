<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { computed } from 'vue'
import { EXPIRING_DOCUMENTS } from '@/features/employees/schemas/expiring-document.fields'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import { listRecords } from '@/shared/lib/records'

defineProps<{ employeeId: string }>()

const { data, isPending, isError, refetch } = useQuery({
  queryKey: ['records', 'document_types', 'options', {}],
  queryFn: () => listRecords('document_types', {}, 'name'),
})
const documents = computed(() =>
  EXPIRING_DOCUMENTS.map((item) => ({
    ...item,
    id: data.value?.find((row) => row.code === item.code)?.id as string | undefined,
  })),
)
</script>

<template>
  <p class="muted">
    Registra cada identificación en su apartado. Para renovarla, agrega la nueva: queda como vigente
    y la anterior se conserva como histórico. El control de documentos muestra solo la vigente.
  </p>
  <ProgressSpinner v-if="isPending" aria-label="Cargando tipos de documento" />
  <Message v-else-if="isError" severity="error" :closable="false">
    No fue posible cargar los tipos de documento.
    <Button label="Reintentar" severity="secondary" text @click="refetch()" />
  </Message>
  <template v-for="item in documents" v-else :key="`${employeeId}-${item.code}`">
    <RecordEditor
      v-if="item.id"
      table="employee_document_checklist"
      :title="item.title"
      :fields="item.fields"
      :filter="{ employee_id: employeeId, document_type_id: item.id }"
      order-by="expires_on"
      :empty-message="item.empty"
      delete-message="¿Eliminar este registro? Si es el vigente, pasará a vigente el de vencimiento más reciente. Quedará constancia en el historial de cambios."
    />
    <Message v-else severity="warn" :closable="false">
      {{ item.title }} no está disponible en el catálogo de documentos.
    </Message>
  </template>
</template>
