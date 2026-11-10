<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'
import type { EmployeeFilters } from '@/features/employees/types/employee.types'
import PageIntro from '@/shared/design/PageIntro.vue'
import { formatDate, initials } from '@/shared/utils/format'
import DonutChart from '../components/DonutChart.vue'
import MovementsChart from '../components/MovementsChart.vue'
import {
  countByStatus,
  countTraining,
  countWithoutPayrollAccount,
  monthlyMovements,
  recentHires,
  topJobProfiles,
} from '../dashboard-metrics'
import { listDirectorySummary, listTrainingStatusSummary } from '../services/dashboard.repository'

const auth = useAuthStore()
const router = useRouter()
const list = useEmployeeListStore()
// Las fechas laborales y la capacitación son exclusivas de RRHH, como en Personal.
const isHr = computed(() => auth.hasAnyRole(['hr']))

const COLORS = {
  green: '#0e7f52',
  blue: '#2563eb',
  amber: '#d97706',
  red: '#c0362c',
  grey: '#667085',
}

// Bajo «employees»: guardar a una persona invalida también este resumen.
const directory = useQuery({
  queryKey: ['employees', 'dashboard-summary'],
  queryFn: listDirectorySummary,
})
const training = useQuery({
  queryKey: ['dashboard', 'training'],
  queryFn: listTrainingStatusSummary,
  enabled: isHr,
})

const rows = computed(() => directory.data.value ?? [])
const status = computed(() => countByStatus(rows.value))
const withoutPayroll = computed(() => countWithoutPayrollAccount(rows.value))
const movements = computed(() => monthlyMovements(rows.value, new Date()))
const thisMonth = computed(() => movements.value.at(-1))
const lastMonth = computed(() => movements.value.at(-2))
const profiles = computed(() => topJobProfiles(rows.value))
const profileMax = computed(() => Math.max(1, ...profiles.value.map((profile) => profile.count)))
const hires = computed(() => recentHires(rows.value))

const statusSegments = computed(() => [
  { label: 'Activos', value: status.value.active, color: COLORS.green },
  { label: 'En integración', value: status.value.onboarding, color: COLORS.blue },
  { label: 'Inactivos', value: status.value.terminated, color: COLORS.grey },
])
const trainingSegments = computed(() => {
  const counts = countTraining(training.data.value ?? [])
  return [
    { label: 'Vigentes', value: counts.current, color: COLORS.green },
    { label: 'Por verificar', value: counts.unverified, color: COLORS.blue },
    { label: 'Sin registro', value: counts.missing, color: COLORS.amber },
    { label: 'Vencidos', value: counts.expired, color: COLORS.red },
  ]
})

function comparison(current = 0, previous = 0) {
  if (current === previous) return 'Igual que el mes anterior'
  const difference = Math.abs(current - previous)
  return `${difference} ${current > previous ? 'más' : 'menos'} que el mes anterior`
}

interface Kpi {
  key: string
  label: string
  value: number
  icon: string
  note?: string
  tone?: 'warn'
  filters?: Partial<Omit<EmployeeFilters, 'search'>>
}

const kpis = computed<Kpi[]>(() => {
  const items: Kpi[] = [
    {
      key: 'active',
      label: 'Personal activo',
      value: status.value.active,
      icon: 'pi-users',
      filters: { statuses: ['active'] },
    },
    {
      key: 'onboarding',
      label: 'En integración',
      value: status.value.onboarding,
      icon: 'pi-user-plus',
      filters: { statuses: ['onboarding'] },
    },
  ]
  if (isHr.value) {
    items.push(
      {
        key: 'hires',
        label: 'Altas del mes',
        value: thisMonth.value?.hires ?? 0,
        icon: 'pi-sign-in',
        note: comparison(thisMonth.value?.hires, lastMonth.value?.hires),
      },
      {
        key: 'terminations',
        label: 'Bajas del mes',
        value: thisMonth.value?.terminations ?? 0,
        icon: 'pi-sign-out',
        note: comparison(thisMonth.value?.terminations, lastMonth.value?.terminations),
      },
    )
  } else {
    items.push({
      key: 'terminated',
      label: 'Inactivos',
      value: status.value.terminated,
      icon: 'pi-user-minus',
      filters: { statuses: ['terminated'] },
    })
  }
  if (withoutPayroll.value !== null) {
    items.push({
      key: 'payroll',
      label: 'Sin cuenta de nómina',
      value: withoutPayroll.value,
      icon: 'pi-credit-card',
      tone: withoutPayroll.value > 0 ? 'warn' : undefined,
      filters: { withoutPayrollAccount: true },
    })
  }
  return items
})

const employeesHref = router.resolve({ name: 'employees' }).href

// Abre Personal con el filtro de la cifra; parte de la vista predeterminada.
function openEmployees(filters: Kpi['filters']) {
  list.search = ''
  list.reset()
  Object.assign(list.filters, filters)
  void router.push({ name: 'employees' })
}
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Inicio</h1>
    </div>
    <PageIntro text="Resumen del personal y de los pendientes de RRHH." />

    <Message v-if="directory.isError.value" severity="error" :closable="false">
      No fue posible consultar el resumen del personal.
    </Message>

    <template v-else>
      <section class="dashboard-card dashboard-kpis" aria-label="Cifras principales">
        <article
          v-for="kpi in kpis"
          :key="kpi.key"
          class="dashboard-kpi"
          :class="{ 'is-warn': kpi.tone === 'warn' }"
        >
          <span class="dashboard-kpi-icon" aria-hidden="true">
            <i class="pi" :class="kpi.icon" />
          </span>
          <Skeleton v-if="directory.isPending.value" width="4rem" height="2.25rem" />
          <strong v-else class="dashboard-kpi-value">{{
            kpi.value.toLocaleString('es-MX')
          }}</strong>
          <span class="dashboard-kpi-label">{{ kpi.label }}</span>
          <small v-if="kpi.note" class="dashboard-kpi-note">{{ kpi.note }}</small>
          <a
            v-if="kpi.filters"
            class="dashboard-kpi-link"
            :href="employeesHref"
            @click.prevent="openEmployees(kpi.filters)"
          >
            Ver personal
            <span class="dashboard-sr-only">: {{ kpi.label }}</span>
          </a>
        </article>
      </section>

      <div class="dashboard-grid" :class="{ 'is-compact': !isHr }">
        <section v-if="isHr" class="dashboard-card is-wide" aria-labelledby="dashboard-movements">
          <header class="dashboard-card-header">
            <h2 id="dashboard-movements">Movimientos de personal</h2>
            <span class="dashboard-card-meta">Últimos 6 meses</span>
          </header>
          <Skeleton v-if="directory.isPending.value" height="220px" />
          <MovementsChart v-else :months="movements" />
        </section>

        <section class="dashboard-card" aria-labelledby="dashboard-status">
          <header class="dashboard-card-header">
            <h2 id="dashboard-status">Personal por estatus</h2>
          </header>
          <Skeleton v-if="directory.isPending.value" height="260px" />
          <DonutChart v-else :segments="statusSegments" caption="Personas" />
        </section>

        <section class="dashboard-card" aria-labelledby="dashboard-profiles">
          <header class="dashboard-card-header">
            <h2 id="dashboard-profiles">Personal por puesto</h2>
            <span class="dashboard-card-meta">Vigente</span>
          </header>
          <Skeleton v-if="directory.isPending.value" height="200px" />
          <p v-else-if="!profiles.length" class="muted">Aún no hay personal vigente.</p>
          <ol v-else class="dashboard-bars">
            <li v-for="profile in profiles" :key="profile.label">
              <span class="dashboard-bars-label">{{ profile.label }}</span>
              <strong>{{ profile.count }}</strong>
              <span class="dashboard-bars-track" aria-hidden="true">
                <span :style="{ width: `${(profile.count / profileMax) * 100}%` }" />
              </span>
            </li>
          </ol>
        </section>

        <section v-if="isHr" class="dashboard-card" aria-labelledby="dashboard-training">
          <header class="dashboard-card-header">
            <h2 id="dashboard-training">Capacitación obligatoria</h2>
            <RouterLink class="dashboard-card-link" :to="{ name: 'training' }">
              Ver cursos
            </RouterLink>
          </header>
          <Message v-if="training.isError.value" severity="error" :closable="false">
            No fue posible consultar la capacitación.
          </Message>
          <Skeleton v-else-if="training.isPending.value" height="260px" />
          <DonutChart v-else :segments="trainingSegments" caption="Requisitos" />
        </section>

        <section v-if="isHr" class="dashboard-card" aria-labelledby="dashboard-hires">
          <header class="dashboard-card-header">
            <h2 id="dashboard-hires">Altas recientes</h2>
          </header>
          <Skeleton v-if="directory.isPending.value" height="200px" />
          <p v-else-if="!hires.length" class="muted">Aún no hay altas registradas.</p>
          <ul v-else class="dashboard-people">
            <li v-for="person in hires" :key="person.id ?? ''">
              <span class="next-avatar" aria-hidden="true">{{
                initials(person.full_name ?? '')
              }}</span>
              <span class="dashboard-people-text">
                <RouterLink :to="{ name: 'employee-detail', params: { id: person.id } }">
                  {{ person.full_name }}
                </RouterLink>
                <small>{{ person.job_profile_name ?? 'Sin puesto vigente' }}</small>
              </span>
              <span class="dashboard-people-date">{{ formatDate(person.hire_date) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-card {
  min-width: 0;
  padding: 1.25rem;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.dashboard-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dashboard-kpi {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.dashboard-kpi-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.5rem;
  border-radius: 50%;
  background: var(--app-background);
}

.dashboard-kpi-value {
  font-size: 2rem;
  line-height: 1.1;
}

.dashboard-kpi.is-warn .dashboard-kpi-value {
  color: #b54708;
}

.dashboard-kpi-note {
  color: var(--app-muted);
}

.dashboard-kpi-link,
.dashboard-card-link {
  font-size: 0.875rem;
  white-space: nowrap;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.dashboard-card.is-wide {
  grid-column: span 2;
}

/* Sin las tarjetas de RRHH quedan dos: ocupan todo el ancho. */
.dashboard-grid.is-compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dashboard-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.dashboard-card-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.dashboard-card-meta {
  color: var(--app-muted);
  font-size: 0.85rem;
}

.dashboard-bars,
.dashboard-people {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dashboard-bars li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.4rem 1rem;
}

.dashboard-bars-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-bars-track {
  grid-column: 1 / -1;
  height: 8px;
  border-radius: 4px;
  background: var(--app-background);
}

.dashboard-bars-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0e7f52;
}

.dashboard-people li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-people .next-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 2.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--app-background);
  font-size: 0.8rem;
  font-weight: 700;
}

.dashboard-people-text {
  display: grid;
  min-width: 0;
}

.dashboard-people-text small {
  color: var(--app-muted);
}

.dashboard-people-date {
  margin-left: auto;
  color: var(--app-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.dashboard-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid,
  .dashboard-grid.is-compact {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-card.is-wide {
    grid-column: auto;
  }
}
</style>
