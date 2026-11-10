<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from './ThemeSwitcher.vue'
defineProps<{ links: { to: string; label: string }[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()
const route = useRoute()
function closeMenu() {
  open.value = false
  emit('close')
}
const currentPath = computed(() => route.path)
watch(currentPath, () => {
  open.value = false
})
const icons: Record<string, string> = {
  '/inicio': 'pi-home',
  '/personal': 'pi-users',
  '/permisos': 'pi-calendar',
  '/capacitacion': 'pi-book',
  '/licitaciones': 'pi-briefcase',
  '/catalogos': 'pi-th-large',
  '/historial': 'pi-history',
  '/integraciones': 'pi-sync',
}
</script>

<template>
  <aside class="next-sidebar">
    <nav
      id="next-navigation"
      class="next-navigation"
      :class="{ 'is-open': open }"
      aria-label="Principal"
      @keydown.esc.prevent="closeMenu"
    >
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :aria-label="link.label"
        :aria-current="route.path.startsWith(link.to) ? 'page' : undefined"
      >
        <i class="pi" :class="icons[link.to]" aria-hidden="true" />
        <span class="next-nav-label" aria-hidden="true">{{ link.label }}</span>
        <i
          v-if="route.path.startsWith(link.to)"
          class="pi pi-angle-right next-nav-marker"
          aria-hidden="true"
        />
      </RouterLink>
      <ThemeSwitcher />
    </nav>
    <div class="next-sidebar-foot">
      <i class="pi pi-lock" aria-hidden="true" />
      <span>
        Espacio de trabajo interno
        <br />
        <small>Acceso según tu perfil</small>
      </span>
    </div>
  </aside>
</template>
