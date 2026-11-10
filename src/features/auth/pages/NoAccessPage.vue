<script setup lang="ts">
import Message from 'primevue/message'
import { useDesignMode } from '@/shared/design/design-mode'
const { isNext } = useDesignMode()
</script>

<template>
  <div v-if="isNext" class="page-header"><h1>Acceso no disponible</h1></div>
  <Message severity="warn" :closable="false">
    Tu cuenta no tiene acceso a esta sección o aún no está activa. Solicita la habilitación al
    administrador del sistema.
  </Message>
  <p v-if="isNext" class="muted">
    Puedes abrir las secciones disponibles en el menú o cerrar sesión para utilizar otra cuenta.
  </p>
</template>
