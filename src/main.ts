import Aura from '@primeuix/themes/aura'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import ConfirmationService from 'primevue/confirmationservice'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createApp } from 'vue'
import App from '@/app/App.vue'
import { router } from '@/app/router'
import 'primeicons/primeicons.css'
import '@/shared/styles/main.css'
import '@/shared/design/design-mode'
import '@/shared/design/next.css'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(VueQueryPlugin)
  // La preferencia oscura se aplica únicamente al nuevo diseño.
  .use(PrimeVue, {
    theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
    locale: {
      dateFormat: 'dd/mm/yy',
      firstDayOfWeek: 1,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ],
      monthNamesShort: [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
      ],
      today: 'Hoy',
      clear: 'Limpiar',
      chooseDate: 'Elegir fecha',
      prevMonth: 'Mes anterior',
      nextMonth: 'Mes siguiente',
      prevYear: 'Año anterior',
      nextYear: 'Año siguiente',
      chooseMonth: 'Elegir mes',
      chooseYear: 'Elegir año',
      emptyFilterMessage: 'Sin resultados',
      emptyMessage: 'Sin opciones',
      emptySearchMessage: 'Sin resultados',
      emptySelectionMessage: 'Sin selección',
      searchMessage: '{0} resultados',
      selectionMessage: '{0} seleccionados',
      aria: {
        close: 'Cerrar',
        pageLabel: 'Página {page}',
        firstPageLabel: 'Primera página',
        lastPageLabel: 'Última página',
        nextPageLabel: 'Página siguiente',
        prevPageLabel: 'Página anterior',
      },
    },
  })
  .use(ToastService)
  .use(ConfirmationService)
  .mount('#app')
