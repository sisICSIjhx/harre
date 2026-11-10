import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import { confirmDiscardChanges } from '@/shared/design/unsaved-changes'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/acceso',
      component: () => import('@/app/layouts/AuthLayout.vue'),
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/features/auth/pages/LoginPage.vue'),
          meta: { public: true },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/app/layouts/MainLayout.vue'),
      children: [
        { path: '', redirect: { name: 'home' } },
        {
          path: 'inicio',
          name: 'home',
          component: () => import('@/features/dashboard/pages/DashboardPage.vue'),
          meta: { roles: ['hr', 'viewer', 'payroll'] },
        },
        {
          path: 'sin-acceso',
          name: 'no-access',
          component: () => import('@/features/auth/pages/NoAccessPage.vue'),
        },
        {
          path: 'personal',
          name: 'employees',
          component: () => import('@/features/employees/pages/EmployeesPage.vue'),
          meta: { roles: ['hr', 'viewer', 'payroll'] },
        },
        {
          path: 'personal/nuevo',
          name: 'employee-create',
          component: () => import('@/features/employees/pages/EmployeeCreatePage.vue'),
          meta: { roles: ['hr'] },
        },
        {
          path: 'personal/:id',
          name: 'employee-detail',
          component: () => import('@/features/employees/pages/EmployeeDetailPage.vue'),
          props: true,
          meta: { roles: ['hr', 'viewer', 'payroll'] },
        },
        {
          path: 'personal/:id/editar',
          name: 'employee-edit',
          component: () => import('@/features/employees/pages/EmployeeEditPage.vue'),
          props: true,
          meta: { roles: ['hr'] },
        },
        {
          path: 'permisos',
          name: 'leave-permits',
          component: () => import('@/features/leave/pages/LeavePermitsPage.vue'),
          meta: { roles: ['hr', 'payroll'] },
        },
        {
          path: 'capacitacion',
          name: 'training',
          component: () => import('@/features/training/pages/CoursesPage.vue'),
          meta: { roles: ['hr', 'viewer'] },
        },
        {
          path: 'licitaciones',
          name: 'tenders',
          component: () => import('@/features/training/pages/TendersPage.vue'),
          meta: { roles: ['hr'] },
        },
        {
          path: 'catalogos',
          name: 'catalogs',
          component: () => import('@/features/training/pages/CatalogsPage.vue'),
          meta: { roles: ['hr', 'viewer'] },
        },
        {
          path: 'historial',
          name: 'audit-history',
          component: () => import('@/features/integrations/pages/AuditHistoryPage.vue'),
          meta: { roles: ['hr', 'admin'] },
        },
        {
          path: 'integraciones',
          name: 'integrations',
          component: () => import('@/features/integrations/pages/SyncStatusPage.vue'),
          meta: { roles: ['hr', 'admin'] },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(authGuard)
router.beforeEach((to, from) => to.path === from.path || confirmDiscardChanges())
