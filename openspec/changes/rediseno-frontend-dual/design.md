# Design

## Context

Ver `proposal.md`. Vue 3/PrimeVue Aura claro, verde esmeralda y neutros en `main.css`; fuente del sistema y PrimeIcons. Diez páginas, dos layouts, diez secciones de expediente y editores reutilizados. No existen aquí los archivos llamados `CONTEXTO_PROYECTO_ICSI_RRHH.md` ni `ARQUITECTURA_ICSI_RRHH.md`; se consultaron `docs/CONTEXTO_PROYECTO.md` y `docs/architecture.md`. Este último todavía se describe como propuesta: prevalece el código.

## Goals / Non-Goals

**Goals:** presentación alternativa completa con una sola instancia de cada formulario y consulta; conservar estado incluso en diálogos y archivos seleccionados.

**Non-Goals:** backend, migraciones, nuevos roles, dashboards, vacaciones, permisos laborales, fuentes externas o dependencias de aplicación.

## Decisions

- Composable compartido de modo con clave `icsi-rrhh:design:v1`, alcance navegador/dispositivo, no por cuenta. No contiene datos personales. Lectura antes de montar Vue. Migración futura a preferencias por cuenta requeriría contrato separado.
- Layout estable: el `RouterView` no cambia de padre ni de key al alternar. Navegación nueva en componente independiente; el contenido compartido nunca se duplica. Reemplazar layouts con `v-if` desmontaría formularios: se descarta esa alternativa.
- Composición nueva real: sidebar, breadcrumb, encabezado contextual, barra de resultados/filtros, índice de expediente, selección de catálogo, agrupación semántica de formularios y explicación de publicación. Adaptadores y slots de presentación sin duplicar servicios.
- Tokens `--next-*` y estilos bajo `html[data-design="next"]`; esto alcanza los overlays teletransportados. Estilos originales intactos. No cambiar globalmente Aura. Primario verde más oscuro de la escala existente para contraste; superficies opacas, radios 4/8 px, espaciado 4/8/12/16/24/32, fuente del sistema, iconos existentes.
- Protección de formularios con metadatos de VeeValidate y registro efímero; confirmación de navegación/cierre y beforeunload. Cambio de diseño no navega ni descarta nada.
- Directorio conserva store de filtros y columnas; no se reintroduce columna número eliminada en el cambio previo. Secciones privadas continúan sujetas a `canManage`. Catálogos y tabs mantienen componentes montados al alternar.

## Risks / Trade-offs

- [Estilos de overlays] → scope en html, validar diálogo/select/toast en ambos modos.
- [Datos locales reales mezclados con semilla] → capturas de entrega únicamente con búsqueda sintética o estados vacíos; no editar personas reales.
- [Cambios locales sin commit] → copia previa en `.cache/redesign-before/src/`; no crear un commit masivo.
- [Servicios externos] → registrar por separado lo probado localmente y SharePoint real pendiente.
- [Accesibilidad] → pruebas de teclado y reflujo; no afirmar certificación WCAG.

## Migration Plan

No hay migración ni despliegue. Inicio predeterminado actual. Para revertir presentación, elegir «Diseño actual»; para revertir código, comparar/restaurar selectivamente el respaldo, preservando cambios posteriores.
