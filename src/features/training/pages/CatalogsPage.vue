<script setup lang="ts">
import RecordEditor from '@/shared/components/RecordEditor.vue'
import { computed, ref } from 'vue'
import PageIntro from '@/shared/design/PageIntro.vue'
import SectionNav from '@/shared/design/SectionNav.vue'
import { useDesignMode } from '@/shared/design/design-mode'
import { confirmDiscardChanges } from '@/shared/design/unsaved-changes'
import {
  bankFields,
  documentTypeFields,
  jobProfileFields,
  projectFields,
  systemFields,
} from '@/shared/lib/catalog-fields'
const { isNext } = useDesignMode()
const selectedValue = ref('jobs')
const selected = computed({
  get: () => selectedValue.value,
  set: async (value: string) => {
    if (value !== selectedValue.value && (await confirmDiscardChanges()))
      selectedValue.value = value
  },
})
const categories = [
  { value: 'jobs', label: 'Puestos' },
  { value: 'projects', label: 'Proyectos y licitaciones' },
  { value: 'systems', label: 'Sistemas externos' },
  { value: 'documents', label: 'Tipos de documento' },
  { value: 'banks', label: 'Bancos' },
]
</script>

<template>
  <div class="page-header">
    <h1>Catálogos</h1>
  </div>
  <PageIntro
    text="Administra las opciones que se utilizan al capturar expedientes. Selecciona un catálogo para consultar sus registros."
  />
  <div class="catalog-workspace">
    <SectionNav v-model="selected" :items="categories" label="Catálogos disponibles" />
    <div class="catalog-panels">
      <RecordEditor
        v-show="!isNext || selected === 'jobs'"
        table="job_profiles"
        title="Puestos"
        :fields="jobProfileFields"
        order-by="name"
        empty-message="Aún no hay puestos en el catálogo."
      />
      <RecordEditor
        v-show="!isNext || selected === 'projects'"
        table="projects"
        title="Proyectos y licitaciones"
        :fields="projectFields"
        order-by="name"
        empty-message="Aún no hay proyectos."
      />
      <RecordEditor
        v-show="!isNext || selected === 'systems'"
        table="external_systems"
        title="Sistemas que asignan número de personal"
        :fields="systemFields"
        order-by="name"
        empty-message="Aún no hay sistemas."
      />
      <RecordEditor
        v-show="!isNext || selected === 'documents'"
        table="document_types"
        title="Documentos del expediente"
        :fields="documentTypeFields"
        order-by="code"
        empty-message="Aún no hay documentos."
      />
      <RecordEditor
        v-show="!isNext || selected === 'banks'"
        table="banks"
        title="Bancos para cuentas de nómina"
        :fields="bankFields"
        order-by="name"
        empty-message="Aún no hay bancos."
      />
    </div>
  </div>
</template>
