<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listRecords, type RecordRow } from '@/shared/lib/records'
import { getSensitiveData } from '@/features/employees/services/employees.repository'
import { ageInYears } from '@/shared/utils/age'

// Solo se monta para RRHH, igual que Contactos y Datos personales.
const props = defineProps<{ employeeId: string }>()
const filter = computed(() => ({ employee_id: props.employeeId }))
const emails = useQuery({
  queryKey: computed(() => ['records', 'employee_emails', filter.value]),
  queryFn: () => listRecords('employee_emails', filter.value, 'created_at'),
})
const phones = useQuery({
  queryKey: computed(() => ['records', 'employee_phones', filter.value]),
  queryFn: () => listRecords('employee_phones', filter.value, 'created_at'),
})
const personal = useQuery({
  queryKey: ['employees', 'sensitive', computed(() => props.employeeId)],
  queryFn: () => getSensitiveData(props.employeeId),
})
function preferred(rows: RecordRow[] | undefined, active: string) {
  const current = rows?.filter((row) => row[active] === true) ?? []
  return current.find((row) => row.is_primary === true) ?? current[0]
}
const email = computed(() => preferred(emails.data.value, 'is_active')?.email)
const phone = computed(() => {
  const row = preferred(phones.data.value, 'is_current')
  return row ? `${row.phone_number}${row.extension ? ` · Ext. ${row.extension}` : ''}` : null
})
const age = computed(() => ageInYears(personal.data.value?.birth_date))
</script>

<template>
  <dl class="next-profile-contact">
    <div>
      <dt><i class="pi pi-envelope" aria-hidden="true" /> Correo</dt>
      <dd>
        {{
          emails.isPending.value
            ? 'Cargando…'
            : emails.isError.value
              ? 'No disponible'
              : email || 'Sin correo registrado'
        }}
      </dd>
    </div>
    <div>
      <dt><i class="pi pi-phone" aria-hidden="true" /> Teléfono</dt>
      <dd>
        {{
          phones.isPending.value
            ? 'Cargando…'
            : phones.isError.value
              ? 'No disponible'
              : phone || 'Sin teléfono registrado'
        }}
      </dd>
    </div>
    <div>
      <dt><i class="pi pi-calendar" aria-hidden="true" /> Edad</dt>
      <dd>
        {{
          personal.isPending.value
            ? 'Cargando…'
            : personal.isError.value
              ? 'No disponible'
              : age === null
                ? 'Sin fecha de nacimiento'
                : `${age} años`
        }}
      </dd>
    </div>
  </dl>
</template>
