import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: string[]
  }
}

// Mejora la navegación; la autorización efectiva la aplica RLS en el backend.
export const authGuard: NavigationGuard = async (to) => {
  const auth = useAuthStore()
  await auth.ready()

  if (to.meta.public) {
    return auth.user && to.name === 'login' ? '/' : true
  }
  if (!auth.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !auth.hasAnyRole(to.meta.roles)) {
    // Pantalla inicial de quien administra acceso, que no consulta Personal.
    if (to.redirectedFrom?.path === '/' && auth.hasAnyRole(['admin'])) {
      return { name: 'integrations' }
    }
    return { name: 'no-access' }
  }
  return true
}
