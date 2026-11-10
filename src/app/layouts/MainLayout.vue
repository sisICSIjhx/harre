<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ThemeSwitcher from '@/shared/design/ThemeSwitcher.vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DesignSwitcher from '@/shared/design/DesignSwitcher.vue'
import NextNavigation from '@/shared/design/NextNavigation.vue'
import { useDesignMode } from '@/shared/design/design-mode'
import { confirmDiscardChanges, releasePendingChanges } from '@/shared/design/unsaved-changes'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useEmployeeListStore } from '@/features/employees/stores/employee-list.store'

const accountOpen = ref(false)
const roleLabels: Record<string, string> = {
  hr: 'Recursos Humanos',
  viewer: 'Consulta',
  payroll: 'Nómina',
  admin: 'Administración',
}
const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()
const { isNext } = useDesignMode()
const sidebarPreferenceKey = 'icsi-rrhh:sidebar-collapsed:v1'
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const sidebarButton = ref<HTMLButtonElement>()
const mobileQuery = window.matchMedia('(max-width: 800px)')
const isMobile = ref(mobileQuery.matches)
function updateViewport() {
  isMobile.value = mobileQuery.matches
  mobileMenuOpen.value = false
}
function toggleSidebar() {
  if (isMobile.value) mobileMenuOpen.value = !mobileMenuOpen.value
  else sidebarCollapsed.value = !sidebarCollapsed.value
}
async function focusSidebarButton() {
  await nextTick()
  sidebarButton.value?.focus()
}
function toggleWithShortcut(event: KeyboardEvent) {
  if (
    isNext.value &&
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === 's' &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented
  ) {
    event.preventDefault()
    toggleSidebar()
  }
}
onMounted(() => {
  mobileQuery.addEventListener('change', updateViewport)
  window.addEventListener('keydown', toggleWithShortcut)
})
onUnmounted(() => {
  mobileQuery.removeEventListener('change', updateViewport)
  window.removeEventListener('keydown', toggleWithShortcut)
})
try {
  sidebarCollapsed.value = localStorage.getItem(sidebarPreferenceKey) === 'true'
} catch {
  // Si el almacenamiento no está disponible, la preferencia dura esta sesión.
}
watch(sidebarCollapsed, (collapsed) => {
  try {
    localStorage.setItem(sidebarPreferenceKey, String(collapsed))
  } catch {
    // Contraer y expandir sigue funcionando sin almacenamiento persistente.
  }
})
const displayName = computed(() => {
  const metadata = auth.user?.user_metadata
  const name = metadata?.full_name ?? metadata?.name
  return typeof name === 'string' ? name.trim().split(/\s+/)[0] : ''
})
const avatarInitials = computed(() =>
  (displayName.value || auth.user?.email || 'IC').slice(0, 2).toLocaleUpperCase('es-MX'),
)

const links = computed(() =>
  [
    { to: '/inicio', label: 'Inicio', roles: ['hr', 'viewer', 'payroll'] },
    { to: '/personal', label: 'Personal', roles: ['hr', 'viewer', 'payroll'] },
    { to: '/permisos', label: 'Permisos', roles: ['hr', 'payroll'] },
    { to: '/licitaciones', label: 'Licitaciones', roles: ['hr'] },
    { to: '/capacitacion', label: 'Capacitación', roles: ['hr', 'viewer'] },
    { to: '/catalogos', label: 'Catálogos', roles: ['hr', 'viewer'] },
    { to: '/historial', label: 'Historial', roles: ['hr', 'admin'] },
    { to: '/integraciones', label: 'Sincronización', roles: ['hr', 'admin'] },
  ].filter((link) => auth.hasAnyRole(link.roles)),
)

async function signOut() {
  if (!(await confirmDiscardChanges())) return
  await auth.signOut()
  releasePendingChanges()
  // Los datos en caché no deben quedar disponibles para quien inicie sesión después.
  queryClient.clear()
  useEmployeeListStore().clear()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="main-layout" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }">
    <a v-if="isNext" class="next-skip" href="#workspace">Ir al contenido</a>
    <header class="main-header">
      <!-- Mismo ancho que el panel lateral: el botón no cambia de posición al contraerlo. -->
      <div v-if="isNext" class="next-header-lead">
        <button
          ref="sidebarButton"
          class="next-collapse-toggle"
          type="button"
          :aria-expanded="isMobile ? mobileMenuOpen : !sidebarCollapsed"
          :aria-label="
            isMobile
              ? mobileMenuOpen
                ? 'Cerrar menú'
                : 'Abrir menú'
              : sidebarCollapsed
                ? 'Expandir panel lateral'
                : 'Contraer panel lateral'
          "
          title="Mostrar/ocultar barra lateral · Ctrl+Shift+S"
          aria-keyshortcuts="Control+Shift+S"
          aria-controls="next-navigation"
          @click="toggleSidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M9 4v16" />
          </svg>
        </button>
        <RouterLink class="next-header-brand" to="/" aria-label="ICSI RRHH, inicio">
          <span class="next-brand-mark" aria-hidden="true">I</span>
          <span class="next-brand-text">ICSI <span>RRHH</span></span>
        </RouterLink>
      </div>
      <strong v-show="!isNext">ICSI RRHH</strong>
      <nav v-show="!isNext" class="main-nav" aria-label="Principal">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <p v-if="isNext" class="next-greeting">
        <span>{{ displayName ? `Hola, ${displayName}` : 'Hola' }}</span>
        <span aria-hidden="true">👋</span>
      </p>
      <div class="main-user">
        <RouterLink
          v-if="isNext && auth.hasAnyRole(['hr', 'viewer', 'payroll'])"
          class="next-header-search"
          :to="{ name: 'employees' }"
          aria-label="Buscar personal"
          title="Buscar personal"
        >
          <i class="pi pi-search" aria-hidden="true" />
          <span aria-hidden="true">Buscar personal…</span>
        </RouterLink>
        <DesignSwitcher />
        <span v-show="!isNext">{{ auth.user?.email }}</span>
        <Button
          :label="isNext ? undefined : 'Salir'"
          aria-label="Salir"
          title="Salir"
          icon="pi pi-sign-out"
          severity="secondary"
          text
          @click="signOut"
        />
        <button
          v-if="isNext"
          type="button"
          class="next-account-avatar"
          aria-haspopup="dialog"
          :aria-label="`Abrir mi cuenta y preferencias: ${auth.user?.email ?? 'Usuario'}`"
          :title="auth.user?.email"
          @click="accountOpen = true"
        >
          {{ avatarInitials }}
        </button>
      </div>
    </header>
    <Dialog
      v-model:visible="accountOpen"
      modal
      header="Mi cuenta y preferencias"
      :style="{ width: '440px', maxWidth: 'calc(100vw - 32px)' }"
    >
      <div class="next-account-settings">
        <dl>
          <div>
            <dt>Nombre</dt>
            <dd>
              {{
                auth.user?.user_metadata?.full_name ||
                  auth.user?.user_metadata?.name ||
                  'Sin nombre registrado'
              }}
            </dd>
          </div>
          <div>
            <dt>Correo de acceso</dt>
            <dd>{{ auth.user?.email }}</dd>
          </div>
          <div>
            <dt>Perfil de acceso</dt>
            <dd>
              {{
                auth.roles.map((role) => roleLabels[role] ?? role).join(', ') ||
                  'Sin perfil asignado'
              }}
            </dd>
          </div>
        </dl>
        <h3>Apariencia</h3>
        <ThemeSwitcher />
        <p class="muted">La apariencia del nuevo diseño se guarda en este navegador.</p>
        <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary" @click="signOut" />
      </div>
    </Dialog>
    <NextNavigation
      v-if="isNext"
      v-model:open="mobileMenuOpen"
      :links="links"
      @close="focusSidebarButton"
    />
    <main id="workspace" class="main-content" tabindex="-1">
      <!-- Siempre presente: alternar el diseño no vuelve a montar la vista. -->
      <div class="page-surface">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.main-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface);
}

.main-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1;
}

.main-nav a {
  color: inherit;
  text-decoration: none;
  padding: 0.25rem 0;
}

.main-nav a.router-link-active {
  font-weight: 600;
  border-bottom: 2px solid currentColor;
}

.main-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
