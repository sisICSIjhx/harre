<script setup lang="ts">
import { useThemeMode } from './theme-mode'
const { theme, saved, setTheme } = useThemeMode()
</script>

<template>
  <div class="next-theme-control">
    <div class="next-theme-switch" role="group" aria-label="Apariencia">
      <button
        type="button"
        :aria-pressed="theme === 'light'"
        title="Modo claro"
        @click="setTheme('light')"
      >
        <i class="pi pi-sun" aria-hidden="true" /><span>Claro</span>
      </button>
      <button
        type="button"
        :aria-pressed="theme === 'dark'"
        title="Modo oscuro"
        @click="setTheme('dark')"
      >
        <i class="pi pi-moon" aria-hidden="true" /><span>Oscuro</span>
      </button>
    </div>
    <small v-if="!saved" role="status">La preferencia se conservará solo durante esta sesión.</small>
  </div>
</template>
