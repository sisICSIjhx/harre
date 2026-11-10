<script setup lang="ts">
import DesignSwitcher from '@/shared/design/DesignSwitcher.vue'
import { useDesignMode } from '@/shared/design/design-mode'
const { isNext } = useDesignMode()
</script>
<template>
  <main class="auth-layout">
    <div class="auth-design-control"><DesignSwitcher /></div>
    <aside v-if="isNext" class="next-auth-intro">
      <p class="next-auth-brand">
        <span class="next-brand-mark" aria-hidden="true">I</span>
        ICSI RRHH · Recursos Humanos
      </p>
      <h1>La información de tu equipo,<br />en su lugar.</h1>
      <p>
        Consulta el directorio, organiza expedientes y da seguimiento a la capacitación desde un
        mismo espacio de trabajo.
      </p>
      <div class="next-auth-note">
        <i class="pi pi-lock" aria-hidden="true" /> Acceso interno para personal autorizado
      </div>
    </aside>
    <RouterView />
  </main>
</template>

<style scoped>
.auth-design-control {
  position: absolute;
  top: 1rem;
  right: 1rem;
}
.auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}
</style>
