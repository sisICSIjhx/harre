<script setup lang="ts">
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import RecordEditor from '@/shared/components/RecordEditor.vue'
import { courseFields } from '@/shared/lib/catalog-fields'
import type { RecordField } from '@/shared/lib/record-fields'
import PageIntro from '@/shared/design/PageIntro.vue'
import SectionNav from '@/shared/design/SectionNav.vue'
import { useDesignMode } from '@/shared/design/design-mode'
import { computed, ref } from 'vue'
import { confirmDiscardChanges } from '@/shared/design/unsaved-changes'
const { isNext } = useDesignMode()
const selectedValue = ref('catalog')
const sections = [
  { value: 'catalog', label: 'Cursos y certificaciones' },
  { value: 'job', label: 'Requisitos por puesto' },
  { value: 'tender', label: 'Requisitos por licitación' },
]
const selected = computed({
  get: () => selectedValue.value,
  set: async (value: string) => {
    if (value !== selectedValue.value && (await confirmDiscardChanges()))
      selectedValue.value = value
  },
})

const requirementFields: RecordField[] = [
  {
    key: 'job_profile_id',
    label: 'Puesto',
    type: 'lookup',
    required: true,
    lookup: { table: 'job_profiles', label: 'name' },
  },
  {
    key: 'course_id',
    label: 'Curso',
    type: 'lookup',
    required: true,
    lookup: { table: 'courses', label: 'name' },
  },
  { key: 'is_mandatory', label: 'Obligatorio', type: 'boolean', initial: true },
  { key: 'periodicity_months', label: 'Periodicidad (meses)', type: 'number' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
const projectRequirementFields: RecordField[] = [
  {
    key: 'project_id',
    label: 'Proyecto o licitación',
    type: 'lookup',
    required: true,
    lookup: { table: 'projects', label: 'name' },
  },
  {
    key: 'job_profile_id',
    label: 'Puesto',
    type: 'lookup',
    required: true,
    lookup: { table: 'job_profiles', label: 'name' },
  },
  {
    key: 'course_id',
    label: 'Curso',
    type: 'lookup',
    required: true,
    lookup: { table: 'courses', label: 'name' },
  },
  { key: 'is_mandatory', label: 'Obligatorio', type: 'boolean', initial: true },
  { key: 'source', label: 'Origen (bases, criterios…)' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]
</script>

<template>
  <div class="page-header">
    <h1>Capacitación</h1>
  </div>
  <PageIntro
    text="Consulta cursos y certificaciones, y configura los requisitos que corresponden a cada puesto o licitación."
  />
  <SectionNav v-model="selected" :items="sections" label="Secciones de capacitación" />
  <Tabs v-model:value="selected" lazy scrollable>
    <TabList v-show="!isNext">
      <Tab value="catalog">
        {{
          isNext ? 'Cursos y certificaciones' : 'Catálogo de cursos y certificaciones'
        }}
      </Tab>
      <Tab value="job">
        {{
          isNext ? 'Requisitos por puesto' : 'Cursos que exige cada puesto, en cualquier licitación'
        }}
      </Tab>
      <Tab value="tender">
        {{
          isNext ? 'Requisitos por licitación' : 'Cursos que exige cada licitación'
        }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="catalog">
        <RecordEditor
          table="courses"
          :fields="courseFields"
          order-by="name"
          empty-message="Aún no hay cursos en el catálogo."
        />
      </TabPanel>
      <TabPanel value="job">
        <div v-if="isNext" class="next-section-heading">
          <h2>Requisitos generales del puesto</h2>
          <p>Estos cursos se exigen en cualquier licitación.</p>
        </div>
        <RecordEditor
          table="job_required_courses"
          :fields="requirementFields"
          :key-fields="['job_profile_id', 'course_id']"
          empty-message="Aún no hay requisitos generales capturados."
        />
      </TabPanel>
      <TabPanel value="tender">
        <div v-if="isNext" class="next-section-heading">
          <h2>Requisitos de una licitación</h2>
          <p>Relaciona el proyecto, el puesto y el curso solicitado en sus bases.</p>
        </div>
        <RecordEditor
          table="project_required_courses"
          :fields="projectRequirementFields"
          :key-fields="['project_id', 'job_profile_id', 'course_id']"
          empty-message="Aún no hay requisitos de licitación capturados."
        />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
