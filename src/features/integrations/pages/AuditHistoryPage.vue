<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { computed, ref } from 'vue'
import {
  listAuditHistory,
  type AuditHistoryRow,
} from '@/features/integrations/services/audit-history.repository'
import { refDebounced } from '@/shared/composables/refDebounced'
import { formatDate, formatDateValue } from '@/shared/utils/format'
import PageIntro from '@/shared/design/PageIntro.vue'
import { useDesignMode } from '@/shared/design/design-mode'
import { auditFieldLabel, auditValue } from '@/shared/design/audit-labels'
const { isNext } = useDesignMode()

const TABLE_LABELS: Record<string, string> = {
  employees: 'Empleado',
  employee_sensitive_data: 'Datos personales',
  employment_records: 'Alta y baja',
  employee_contracts: 'Contrato',
  employee_phones: 'Teléfono',
  employee_emails: 'Correo',
  employee_addresses: 'Domicilio',
  emergency_contacts: 'Contacto de emergencia',
  beneficiaries: 'Beneficiario',
  job_profiles: 'Puesto',
  projects: 'Proyecto',
  employee_assignments: 'Asignación de puesto',
  courses: 'Curso',
  job_required_courses: 'Requisito de puesto',
  project_required_courses: 'Requisito de licitación',
  employee_courses: 'Curso acreditado',
  employee_course_requirements: 'Curso exigido',
  employee_education: 'Formación académica',
  employee_experience: 'Experiencia laboral',
  document_types: 'Tipo de documento',
  education_document_rules: 'Regla de documentos',
  employee_document_checklist: 'Control de documentos',
  employee_documents: 'Archivo',
  external_systems: 'Sistema',
  employee_control_numbers: 'Número de control',
  employee_work_sites: 'Sede',
  employee_confidentiality_agreements: 'Documento firmado, acta o préstamo',
  employee_leave_permits: 'Permiso',
  banks: 'Banco',
  employee_bank_accounts: 'Cuenta bancaria',
  employee_credits: 'Crédito',
  profiles: 'Usuario',
  user_roles: 'Rol de usuario',
  roles: 'Rol',
}

const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const { data, isPending, isError } = useQuery({
  queryKey: ['audit-history', debouncedSearch],
  queryFn: () => listAuditHistory(debouncedSearch.value),
})

const selected = ref<AuditHistoryRow | null>(null)
const dialogVisible = computed({
  get: () => selected.value !== null,
  set: (open) => {
    if (!open) selected.value = null
  },
})

const changes = computed(() => {
  const row = selected.value
  if (!row) return []
  const before = row.old_data
  const after = row.new_data
  const keys = row.changed_fields ?? Object.keys(after ?? before ?? {})
  return keys.map((field) => ({
    field: isNext.value ? auditFieldLabel(field) : field,
    before: isNext.value ? auditValue(field, before?.[field]) : format(field, before?.[field]),
    after: isNext.value ? auditValue(field, after?.[field]) : format(field, after?.[field]),
  }))
})

function format(field: string, value: unknown): string {
  return (
    formatDateValue(field, value) ?? (value === null || value === undefined ? '—' : String(value))
  )
}
</script>

<template>
  <div class="page-header">
    <h1>Historial de cambios</h1>
  </div>
  <PageIntro
    text="Consulta quién realizó cada cambio y revisa sus valores anteriores y posteriores. Este historial es de solo lectura."
  />
  <IconField class="history-search">
    <InputIcon class="pi pi-search" />
    <InputText
      v-model.trim="search"
      placeholder="Usuario o núm. de empleado"
      aria-label="Buscar"
      fluid
    />
  </IconField>
  <Message v-if="isError" severity="error" :closable="false">
    No fue posible cargar el historial.
  </Message>
  <DataTable
    v-else
    :value="data ?? []"
    :loading="isPending"
    paginator
    :rows="25"
    :always-show-paginator="false"
    scrollable
    size="small"
  >
    <template #empty>Sin cambios registrados.</template>
    <Column header="Fecha">
      <template #body="{ data: row }">{{ formatDate(row.change_date) }}</template>
    </Column>
    <Column field="change_time" header="Hora" />
    <Column field="actor_name" header="Usuario" />
    <Column field="action_label" header="Acción" />
    <Column header="Qué">
      <template #body="{ data: row }">
        {{ TABLE_LABELS[row.table_name] ?? (isNext ? 'Registro del sistema' : row.table_name) }}
      </template>
    </Column>
    <Column header="Empleado">
      <template #body="{ data: row }">{{ row.employee_number ?? '—' }}</template>
    </Column>
    <Column header="Campos">
      <template #body="{ data: row }">
        {{
          (isNext ? row.changed_fields?.map(auditFieldLabel) : row.changed_fields)?.join(', ') ??
            '—'
        }}
      </template>
    </Column>
    <Column header="">
      <template #body="{ data: row }">
        <Button label="Ver" severity="secondary" text size="small" @click="selected = row" />
      </template>
    </Column>
  </DataTable>
  <Dialog
    v-model:visible="dialogVisible"
    header="Detalle del cambio"
    modal
    :style="{ width: 'min(760px, 95vw)' }"
  >
    <p v-if="selected" class="muted">
      {{ selected.actor_name }} · {{ formatDate(selected.change_date) }} {{ selected.change_time }}
    </p>
    <DataTable :value="changes" size="small" scrollable>
      <Column field="field" header="Campo" />
      <Column field="before" header="Antes" />
      <Column field="after" header="Después" />
    </DataTable>
  </Dialog>
</template>

<style scoped>
.history-search {
  max-width: 360px;
  margin-bottom: 1rem;
}
</style>
