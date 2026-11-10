<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref } from 'vue'
import Tag from 'primevue/tag'
import SectionNav from '@/shared/design/SectionNav.vue'
import { useDesignMode } from '@/shared/design/design-mode'
import { confirmDiscardChanges } from '@/shared/design/unsaved-changes'
import { EMPLOYEE_STATUS_LABELS } from '@/features/employees/types/employee.types'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import BankAccountsSection from '@/features/employees/components/sections/BankAccountsSection.vue'
import AddressesSection from '@/features/employees/components/sections/AddressesSection.vue'
import ContactsSection from '@/features/employees/components/sections/ContactsSection.vue'
import ControlNumbersSection from '@/features/employees/components/sections/ControlNumbersSection.vue'
import CreditsSection from '@/features/employees/components/sections/CreditsSection.vue'
import DocumentsSection from '@/features/employees/components/sections/DocumentsSection.vue'
import ExpiringDocumentsSection from '@/features/employees/components/sections/ExpiringDocumentsSection.vue'
import EducationSection from '@/features/employees/components/sections/EducationSection.vue'
import EmploymentSection from '@/features/employees/components/sections/EmploymentSection.vue'
import ExperienceSection from '@/features/employees/components/sections/ExperienceSection.vue'
import GeneralInfoSection from '@/features/employees/components/sections/GeneralInfoSection.vue'
import JobProfileSection from '@/features/employees/components/sections/JobProfileSection.vue'
import PermitsSection from '@/features/employees/components/sections/PermitsSection.vue'
import TrainingSection from '@/features/employees/components/sections/TrainingSection.vue'
import {
  useCurrentJobProfile,
  useEmployee,
  useProfileControlNumbers,
} from '@/features/employees/composables/useEmployeeDetails'
import ProfileContactSummary from '@/features/employees/components/ProfileContactSummary.vue'
import { initials } from '@/shared/utils/format'

const props = defineProps<{ id: string }>()
const { isNext } = useDesignMode()
const sectionValue = ref('general')
const selectedSection = computed({
  get: () => sectionValue.value,
  set: async (value: string) => {
    if (value !== sectionValue.value && (await confirmDiscardChanges())) sectionValue.value = value
  },
})

const auth = useAuthStore()
const { data: employee, isPending, isError } = useEmployee(() => props.id)

const canManage = computed(() => auth.hasAnyRole(['hr']))
const { data: jobProfile } = useCurrentJobProfile(() => props.id)
// Números de control solo para RRHH, en la tarjeta del nuevo diseño.
const controlNumbers = useProfileControlNumbers(
  () => props.id,
  () => canManage.value && isNext.value,
)
function controlNumberText(kind: 'hr' | 'payroll') {
  if (controlNumbers.isPending.value) return 'Cargando…'
  if (controlNumbers.isError.value) return 'No disponible'
  return controlNumbers.data.value?.[kind] ?? 'Sin registrar'
}
const fullName = computed(() =>
  [employee.value?.first_name, employee.value?.last_name, employee.value?.second_last_name]
    .filter(Boolean)
    .join(' '),
)

// Roles que ven cada sección; la edición sigue limitada a RRHH dentro de RecordEditor.
const HR = ['hr'] as const
const sections = [
  { value: 'job', label: 'Puestos y proyectos', component: JobProfileSection, roles: HR },
  { value: 'training', label: 'Cursos y certificaciones', component: TrainingSection, roles: HR },
  { value: 'employment', label: 'Contratos y sedes', component: EmploymentSection, roles: HR },
  {
    value: 'permits',
    label: 'Permisos',
    component: PermitsSection,
    roles: ['hr', 'payroll'] as const,
  },
  {
    value: 'bank',
    label: 'Datos bancarios',
    component: BankAccountsSection,
    roles: ['hr', 'payroll'] as const,
  },
  {
    value: 'credits',
    label: 'Créditos',
    component: CreditsSection,
    roles: ['hr', 'payroll'] as const,
  },
  { value: 'contacts', label: 'Contactos', component: ContactsSection, roles: HR },
  { value: 'addresses', label: 'Domicilios', component: AddressesSection, roles: HR },
  { value: 'education', label: 'Formación académica', component: EducationSection, roles: HR },
  { value: 'experience', label: 'Experiencia laboral', component: ExperienceSection, roles: HR },
  { value: 'documents', label: 'Documentos', component: DocumentsSection, roles: HR },
  {
    value: 'validity',
    label: 'Documentos con vigencia',
    component: ExpiringDocumentsSection,
    roles: HR,
  },
  { value: 'control', label: 'Números de control', component: ControlNumbersSection, roles: HR },
]
const visibleSections = computed(() =>
  sections.filter((section) => auth.hasAnyRole([...section.roles])),
)
const sectionItems = computed(() => [
  { value: 'general', label: 'Datos generales' },
  ...visibleSections.value,
])
const sectionTitle = computed(
  () => sectionItems.value.find((section) => section.value === selectedSection.value)?.label,
)
</script>

<template>
  <ProgressSpinner v-if="isPending" aria-label="Cargando" />
  <Message v-else-if="isError || !employee" severity="error" :closable="false">
    No fue posible cargar este expediente o no tienes acceso.
  </Message>
  <template v-else>
    <div class="page-header">
      <h1 v-if="isNext" class="next-detail-title">
        <RouterLink
          class="next-back"
          :to="{ name: 'employees' }"
          aria-label="Volver a Personal"
          title="Volver a Personal"
        >
          <i class="pi pi-angle-left" aria-hidden="true" />
        </RouterLink>
        Expediente
      </h1>
      <h1 v-else>{{ fullName }}</h1>
      <RouterLink
        v-if="canManage && !isNext"
        v-slot="{ navigate }"
        :to="{ name: 'employee-edit', params: { id } }"
        custom
      >
        <Button label="Editar" icon="pi pi-pencil" severity="secondary" @click="navigate" />
      </RouterLink>
    </div>
    <div class="detail-workspace">
      <aside v-if="isNext" class="next-profile-card" aria-label="Resumen de la persona">
        <span class="next-avatar next-avatar-lg" aria-hidden="true">{{ initials(fullName) }}</span>
        <h2>{{ fullName }}</h2>
        <p>{{ jobProfile ?? 'Sin puesto vigente' }}</p>
        <Tag
          :class="`next-status next-status-${employee.employment_status}`"
          :value="EMPLOYEE_STATUS_LABELS[employee.employment_status] ?? employee.employment_status"
        />
        <ProfileContactSummary v-if="canManage" :employee-id="id" />
        <dl>
          <template v-if="canManage">
            <div>
              <dt>Número interno de RRHH</dt>
              <dd>{{ controlNumberText('hr') }}</dd>
            </div>
            <div>
              <dt>Número de nómina</dt>
              <dd>{{ controlNumberText('payroll') }}</dd>
            </div>
          </template>
          <div>
            <dt>Acceso</dt>
            <dd>{{ canManage ? 'Consulta y edición de RRHH' : 'Solo consulta' }}</dd>
          </div>
        </dl>
        <RouterLink
          v-if="canManage"
          v-slot="{ navigate }"
          :to="{ name: 'employee-edit', params: { id } }"
          custom
        >
          <Button label="Editar ficha" icon="pi pi-pencil" @click="navigate" />
        </RouterLink>
      </aside>
      <div class="detail-main">
        <SectionNav
          v-model="selectedSection"
          :items="sectionItems"
          label="Secciones del expediente"
        />
        <Tabs v-model:value="selectedSection" lazy scrollable>
          <TabList v-show="!isNext">
            <Tab value="general">Datos generales</Tab>
            <Tab v-for="section in visibleSections" :key="section.value" :value="section.value">
              {{ section.label }}
            </Tab>
          </TabList>
          <TabPanels>
            <div v-if="isNext" class="next-section-heading">
              <h2>{{ sectionTitle }}</h2>
              <p>Información del expediente seleccionado</p>
            </div>
            <TabPanel value="general">
              <GeneralInfoSection :employee="employee" />
            </TabPanel>
            <TabPanel
              v-for="section in visibleSections"
              :key="section.value"
              :value="section.value"
            >
              <component :is="section.component" :employee-id="id" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  </template>
</template>
