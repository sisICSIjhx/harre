<script setup lang="ts">
import { useDesignMode } from './design-mode'
const { mode, storageAvailable, setDesignMode } = useDesignMode()
</script>

<template>
  <div class="design-switcher">
    <label>
      <span>Cambiar diseño</span>
      <select
        aria-label="Cambiar diseño"
        :value="mode"
        @change="
          setDesignMode(($event.target as HTMLSelectElement).value === 'next' ? 'next' : 'current')
        "
      >
        <option value="current">Diseño actual</option>
        <option value="next">Nuevo diseño</option>
      </select>
    </label>
    <small v-if="!storageAvailable" role="status">Preferencia activa solo en esta sesión.</small>
  </div>
</template>

<style scoped>
.design-switcher label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.design-switcher select {
  font: inherit;
  color: #1f2933;
  background: white;
  border: 1px solid #a9b4b0;
  border-radius: 4px;
  padding: 0.55rem 0.45rem;
  min-height: 40px;
  max-width: 100%;
}
.design-switcher select:focus-visible {
  outline: 2px solid #047857;
  outline-offset: 3px;
}
.design-switcher small {
  display: block;
  max-width: 20rem;
}
@media (max-width: 480px) {
  .design-switcher label {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}
</style>
