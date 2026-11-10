# Rediseño alternativo de ICSI RRHH

Fecha: 2026-11-02, America/Mexico_City. Implementación local, sin despliegue.

## Diagnóstico previo

Se leyó el encargo `PROMPT_REDISENO_FRONTEND_UX_ICSI_RRHH.md` y se inspeccionaron código, estilos, rutas y componentes con CodeGraph. Los documentos con los nombres `CONTEXTO_PROYECTO_ICSI_RRHH.md` y `ARQUITECTURA_ICSI_RRHH.md` no están en este repositorio; sus referencias locales son `docs/CONTEXTO_PROYECTO.md` y `docs/architecture.md`. La arquitectura documental aún incluye propuestas: el código manda.

| Problema observado en código/interfaz                   | Impacto                                          | Solución                                                  | Prioridad |
| ------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- | --------- |
| Seis destinos en navegación horizontal que se envuelve  | Localización difícil en pantallas estrechas      | Sidebar de escritorio y menú móvil                        | Alta      |
| Diez secciones en pestañas horizontales de expediente   | Secciones fuera del área visible                 | Selector compacto sobre el contenido                 | Alta      |
| Formulario de alta en una cuadrícula sin grupos         | Identificación y relación laboral compiten       | Dos bloques semánticos, ayuda y estado de captura         | Alta      |
| Catálogos apilados                                      | Scroll para encontrar cada catálogo              | Dropdown y área de trabajo de catálogo seleccionado         | Media     |
| Acciones de registros solo mediante iconos              | Intención poco evidente                          | Editar/Eliminar con texto en el modo nuevo                | Media     |
| Mensaje de datos personales dice que no se publican     | Contradice la migración de publicación existente | Mensaje correcto en nueva presentación                    | Alta      |
| Cierre/navegación de formularios sin protección general | Posible pérdida de captura                       | Registro efímero de editores, confirmación y beforeunload | Alta      |

No se realizaron entrevistas ni estudios con usuarios. La reducción de esfuerzo es una hipótesis de diseño, no una métrica medida.

## Inventario y línea base

- Once rutas nominales: acceso, sin acceso, directorio, alta, expediente, edición, capacitación, licitaciones, catálogos, historial y sincronización. No hay dashboard ni módulos de vacaciones/permisos implementados.
- Dos layouts: MainLayout y AuthLayout. Componentes base: PrimeVue Aura, PrimeIcons, tablas DataTable, formularios VeeValidate/Zod, diálogos y notificaciones PrimeVue.
- Expediente: datos generales, puestos/proyectos, cursos/certificaciones, contratos/sedes, contactos, domicilios, formación, experiencia, documentos y números de control.
- Permisos conservados: RRHH captura; consulta ve directorio/datos permitidos y catálogos; administración ve auditoría/sincronización según guardas existentes. RLS sigue siendo la autorización efectiva.
- Paleta observada: `#f6f7f9`, `#ffffff`, `#dfe3e8`, `#1f2933`, `#5f6b7a`, `#b42318`; verde esmeralda de Aura en acciones. Sin logo oficial dentro de los recursos revisados; se conserva la marca tipográfica ICSI RRHH.
- Línea base: typecheck y lint correctos, 62 pruebas/8 archivos correctos, build correcto con advertencia previa de chunk principal mayor de 500 kB.
- Respaldo de todo `src/` previo a cambios: `.cache/redesign-before/src/`, excluido de Git. El árbol estaba sin archivos versionados; no se creó un commit ajeno a este encargo.
- Inspección visual previa de acceso y directorio; las capturas de entrega se limitan a vacíos o datos sintéticos, sin expedientes reales.

## Convivencia y sistema visual

`shared/design/design-mode.ts` lee `icsi-rrhh:design:v1` antes del montaje; valores `current` y `next`. Valor inválido o lectura bloqueada → actual. Escritura bloqueada → funciona en memoria e informa de que no se guardará la preferencia. Alcance por navegador/dispositivo, compartido por las cuentas que usen ese navegador. Una futura preferencia por cuenta requerirá contrato propio; no se guardan identificadores de cuenta ni datos personales.

El RouterView, los formularios y las consultas conservan sus instancias al alternar; no se cambia la ruta ni se crean árboles de datos paralelos. NextNavigation y SectionNav añaden la composición nueva. Los estilos de `next.css` se activan solo con `html[data-design="next"]`, incluso en overlays. `main.css` permanece intacto. Volver a actual restaura los patrones anteriores; las protecciones de captura benefician ambos modos.

Tokens: verde de la escala existente, textos gris oscuro, canvas neutro, blanco para datos, borde discreto, estados success/warning/danger/info. Tipografía del sistema, escala 11/12/13/14/18/23/28 px; radios 4/8 px; ritmos 4/8/12/16/20/24/32 px; sidebar 224 px (188 en ventanas medianas, 248 en monitor), contraíble a una columna de iconos de 76 px con el botón de barra lateral o Ctrl+Shift+S. La cabecera usa fondo gris cálido, borde superior oscuro y saludo basado en el nombre disponible en la sesión, con acciones y avatar de iniciales a la derecha. Abarca todo el ancho: su botón permanece en la misma posición al alternar; la navegación queda debajo y en móvil ese mismo control abre/cierra el menú, contenido máximo 1520 px. Transiciones de 140 ms en interacción; reducción de movimiento; sin blur sobre datos ni fuentes remotas.

## Cobertura implementada

| Área                | Presentación nueva                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Acceso / sin acceso | Entrada dividida, formulario compartido, selector, explicación de acceso                                                  |
| Personal            | Barra de búsqueda, resumen de consulta, restablecer vista, apertura explícita, error con reintento                        |
| Alta / edición      | Agrupación identificación/relación laboral, estado de captura, validación existente, protección y concurrencia conservada |
| Expediente          | Regreso al directorio, identificación/estado, selector compacto de diez secciones sobre el contenido y permisos originales |
| Registros repetidos | Editores compartidos con conteos, acciones textuales, diálogos adaptados, selector y protección                           |
| Documentos          | Control separado de archivos, área de carga, estado real y permisos/servicios existentes                                  |
| Capacitación        | Dropdown compartido de secciones y explicación de requisitos generales/específicos                                                       |
| Catálogos           | Dropdown de cuatro categorías, editores a todo el ancho y mismas instancias                                                              |
| Licitaciones        | Herramientas agrupadas y explicación de la consulta existente                                                             |
| Historial           | Contexto de solo lectura, etiquetas comprensibles y diálogo antes/después                                                 |
| SharePoint          | Guardado/publicación separados, carga/sin configuración y estado existente                                                |

## Validación y segunda iteración

### Resultados comprobados

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` y `npm run spec:check` ejecutados. Suite: **76 pruebas / 10 archivos**, frente a 62/8 antes del cambio. Se añadieron pruebas de preferencia inválida, almacenamiento bloqueado, retorno a actual y protección de captura (cancelar, confirmar, guardado en proceso y desmontaje).
- Navegador integrado, servidor local: acceso con perfiles de prueba de RRHH, consulta y administración. Consulta: cero botones de alta/edición, una sola sección de expediente y ningún formulario personal; alta directa redirige a `/sin-acceso`. Administración: únicamente Historial y Sincronización en el menú. No se cambiaron roles ni políticas.
- Se recorrieron las once rutas y las diez secciones de expediente. Se comprobó la edición en móvil sin guardar, el historial sin coincidencias, los filtros del directorio, el selector de catálogos, requisitos de capacitación, filtros de licitaciones y el estado de publicación.
- Alternancia durante alta y dentro del diálogo de catálogo: texto y número `000001` intactos. Cancelar descarte conserva captura; confirmar permite salir. Se verificó selección de sección entre ambos modos, página 2 de directorio conservada y preferencia nueva conservada tras recargar.
- Validación de alta vacía: mensaje junto a Nombres y foco en ese campo. Escape cierra menú móvil y devuelve foco a su botón. Diálogo de descarte enfoca «Seguir editando». Selector nativo etiquetado, errores asociados e IDs de formularios repetidos únicos.
- Directorio sin resultados y alta sin desbordamiento global en **1366×768, 1440×900, 1920×1080, 1024×768, 768×1024, 390×844, 375×667 y 320×667**. Expediente completo revisado en escritorio; datos generales, contactos, documentos y edición comprobados en 390 px. Diálogo de catálogo revisado en 390 px, con scroll interno y cierre visible.
- Cero errores de consola capturados en la sesión final de revisión. La advertencia de build sobre un chunk mayor de 500 kB ya existía; no se añadieron dependencias de aplicación.
- El hash/contenido de `src/shared/styles/main.css` coincide con el respaldo. No se cambiaron servicios, APIs, migraciones, RLS ni esquemas de datos.

### V1 → V2

| Hallazgo de la primera versión                                                      | Refinamiento aplicado                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Confirmación nativa bloqueó el navegador de prueba                                  | Diálogo propio asíncrono, foco inicial seguro, sin bloquear la interfaz            |
| Agrupar alta podía alterar la cuadrícula del modo anterior                          | Contenedores con `display: contents` en actual; grupos reales solo en nuevo        |
| Datos personales editados en actual podían quedar ocultos al pasar a consulta nueva | Activación de edición al detectar entrada en el formulario compartido              |
| Etiquetas/IDs repetibles y errores sin asociación suficiente                        | Prefijos únicos por formulario, `aria-describedby`, alertas y foco al primer error |
| Escape cerraba menú sin recuperar el foco                                           | Retorno al botón Menú                                                              |
| Cierre y paginación de PrimeVue se anunciaban en inglés                             | Etiquetas accesibles en español en ambos modos                                     |
| Texto existente negaba la publicación de datos personales                           | Corrección factual en ambos diseños, sin cambiar la publicación                    |

### Criterios y límites

CA-01 a CA-06 y CA-11 a CA-14, CA-17 a CA-20: implementados y respaldados por los controles y recorridos descritos. CA-07: todas las rutas cubiertas, sin afirmar cobertura exhaustiva de todos los estados de red. CA-08 a CA-10: tamaños comprobados para directorio/alta y revisión móvil adicional del expediente; no se recorrió cada combinación de ruta por resolución. CA-15: revisión básica de teclado, etiquetas, foco y reglas de movimiento reducido; **no certificación WCAG ni prueba con lector de pantalla real**. CA-16: validación, carga, vacío, confirmaciones y estado de publicación revisados; no se forzaron fallos de red ni se guardaron cambios en datos reales.

El atajo de zoom no modificó la escala del navegador integrado; el **zoom real al 200 % queda por verificar**. Los anchos estrechos sí se probaron. No se modificó la preferencia del sistema de movimiento reducido: su regla se verificó en código. No se crearon empleados ni se subieron/descargaron documentos reales; guardado end-to-end, concurrencia entre dos sesiones y publicación a SharePoint real quedan para un entorno de datos desechables autorizado. No hay despliegue.

### Evidencias locales

Archivos excluidos de Git en `.cache/redesign-qa/`: comparación `alta-actual-1366.jpg` / `alta-nuevo-1366.jpg`, `alta-nuevo-390.jpg`, `dialogo-nuevo-390.jpg`, `acceso-nuevo-1440.jpg`, `personal-nuevo-1440.jpg`, `personal-nuevo-390.jpg` y `responsive.json`. Solo contienen formularios vacíos, texto sintético, estados sin resultados o cuenta de prueba; no contienen expedientes personales.

## Archivos y responsabilidad

- `src/shared/design/`: modo y persistencia, selector, navegación principal/de secciones, introducciones de página, tokens, etiquetas de auditoría y protección asíncrona de captura.
- `src/app/App.vue`, layouts y router: diálogo global, shell estable y confirmación de abandono; sin reemplazar componentes de ruta por modo.
- `src/features/employees/pages/` y `EmployeeForm.vue`, `EmployeesTable.vue`: directorio, ficha, resumen, grupos del formulario y limpieza del estado pendiente solo tras éxito de los callbacks existentes.
- `GeneralInfoSection.vue`, `DocumentsSection.vue`: lectura/edición personal, texto de publicación correcto y explicación/estado de carga de archivos. Las demás secciones utilizan los editores compartidos.
- `RecordEditor.vue` / `RecordForm.vue`: edición repetible, IDs únicos, feedback, cierre protegido y selector dentro del diálogo.
- Páginas de auth/training/integrations: presentación y contexto según tarea, sin duplicar repositorios.
- `src/main.ts`: carga de estilos aislados y etiquetas accesibles en español. `tsconfig.node.json`: incluye composables puros probados. Dos archivos nuevos de pruebas unitarias.
- OpenSpec `rediseno-frontend-dual`, este informe, contexto e historial: requisitos, decisiones, validación y límites.

## Prueba local

Ejecutar `npm run dev`, abrir la URL que informe Vite e iniciar sesión con una cuenta local autorizada. Elegir «Nuevo diseño» en «Cambiar diseño». Alternar durante una búsqueda, con un formulario modificado y dentro de un diálogo. Recargar sin borradores para comprobar preferencia. Las credenciales de prueba se documentan en la semilla existente; no se copian aquí. No ejecutar reset ni cargar datos para probar la presentación.

## Formato uniforme de fechas — 02/11/2026

Todas las fechas de la interfaz se presentan y capturan como DD/MM/AAAA en ambos diseños. El componente compartido `DateInput` conserva el calendario en español y convierte únicamente fechas válidas al contrato ISO de los servicios. Los valores incompletos o imposibles no se guardan; en filtros no se aplican hasta ser válidos. Las fechas con hora de archivos, sincronización e historial conservan HH:mm. No cambia la zona horaria con la que se muestran los instantes ni el almacenamiento.

Validación: 94 pruebas aprobadas, incluidas 18 de fechas; build y lint correctos. Se revisaron alta/baja, filtros, lectura de nacimiento y fechas de cursos; alternancia de diseños y calendarios a 390/320 px. No se guardaron registros de prueba ni se probó una publicación externa.

## Adaptación a la plantilla HRDashboard — 02/11/2026

Referencia: archivo comunitario de Figma «HRDashboard - HR Management Dashboard UI Kit». En la versión gratuita cada pantalla es una imagen plana, así que se tomaron medidas y colores de capturas de acceso, lista de empleados, filtro, expediente (General y Payroll) y documentos. Solo afecta al «Nuevo diseño»; el diseño actual no cambia.

**Se adoptó:** lienzo `#fafafa` con superficies blancas de radio 16 px; cabecera blanca con marca y buscador en píldora; barra lateral blanca con la opción activa en verde sólido; acciones principales oscuras (`#121828`) y secundarias delineadas; tabla con encabezado gris redondeado, iniciales y número bajo el nombre, estatus en píldora (activo, en integración, inactivo) y botón verde para abrir el expediente; expediente con tarjeta de perfil a la izquierda y contenido a la derecha, con datos en pares etiqueta/valor; acceso dividido, con panel oscuro y franja verde a la izquierda y formulario sobre blanco.

**Se ajustó:** el verde de la plantilla (`#0cad5d`) tiene contraste de 2.9:1 con texto blanco; en textos y rellenos se usa `#0e7f52` (5:1) y el verde original solo en la marca decorativa. La fotografía del acceso se sustituye por un fondo gráfico, sin imágenes ni fuentes externas.

**Se conservó por decisiones anteriores del usuario:** cabecera continua con el botón lateral en la misma posición al contraer (la línea inferior empieza donde empieza el contenido, como en la plantilla), saludo y selectores desplegables de secciones en lugar de pestañas.

**No se incluyó** lo que la aplicación no tiene: asistencia, vacaciones, nómina como módulo, reclutamiento, rendimiento, noticias, mensajes y notificaciones, ayuda, modo oscuro, inicio de sesión con Google o Apple, registro de cuentas, recordar sesión, exportar y selección múltiple de filas.

Validación: typecheck, lint, 116 pruebas y build correctos. Navegador: Personal, expediente, Catálogos, Capacitación y acceso a 1440 px; panel contraído con el botón en la misma posición; Personal, expediente y acceso a 390 px sin desbordamiento horizontal; diseño actual sin cambios. Persiste la advertencia previa de bundle mayor de 500 kB.

### Inicio (tablero) — 03/11/2026

Página nueva `/inicio`, basada en «Home - V1» de la plantilla, y destino de `/` para RRHH, Consulta y Nómina; Admin sigue entrando a Sincronización. Es funcionalidad, así que existe en ambos diseños: el actual la muestra con tarjetas sencillas y el nuevo con las superficies, iconos en círculo y separadores de la plantilla.

- **Cifras:** personal activo y en integración (todos), altas y bajas del mes frente al mes anterior (RRHH), inactivos (Consulta y Nómina) y activos sin cuenta de nómina (RRHH y Nómina). Cada cifra filtrable abre Personal con ese filtro.
- **Tarjetas:** movimientos de personal de los últimos 6 meses (RRHH), personal por estatus, personal vigente por puesto, capacitación obligatoria por estado (RRHH) y altas recientes (RRHH). Las fechas laborales y la capacitación siguen siendo exclusivas de RRHH, como en Personal.
- **Gráficas:** SVG propias, sin librerías nuevas. La dona se acompaña de una leyenda con cifras y las barras de una tabla oculta para lectores de pantalla. Colores con contraste de al menos 3:1 sobre blanco.
- **No se tomó** de «Home»: desempeño por equipos, solicitantes y vacantes, filtros por oficina y la tabla completa de empleados (Personal ya la tiene).

Cálculos en `src/features/dashboard/dashboard-metrics.ts` (pruebas en `tests/unit/dashboard-metrics.test.ts`); las consultas leen por páginas de 1000 filas por el límite de PostgREST. Validado con RRHH, Consulta, Nómina y Admin a 1440 px, RRHH a 375 px sin desbordamiento y en el diseño actual.

## Ficha, cuenta y tema — 03/11/2026

Se amplía la adaptación HRDashboard con correo activo, teléfono vigente (principal primero, con extensión) y edad calculada en la tarjeta del expediente. Los tres datos se muestran solo a RRHH, igual que sus secciones de origen; se reutilizan claves de consulta para refrescar el resumen al guardar contactos/datos personales. Ausencia, carga y error tienen mensajes distintos.

El avatar abre Mi cuenta y preferencias: identidad y perfiles de la sesión, cambio de apariencia y cierre de sesión con protección existente de borradores. El selector Claro/Oscuro está también en el panel izquierdo y en su menú móvil. La preferencia usa icsi-rrhh:theme:v1 en el navegador; el diseño actual permanece claro. Si el almacenamiento falla, el cambio funciona en memoria y se informa.

Documentos conserva Abrir y añade Descargar sin acción, anunciado como no disponible, junto al aviso Próximamente. No hay descarga implementada ni cambios de servicios, permisos o almacenamiento.

Criterios verificados: compilación y lint sin errores, 150 pruebas; cuenta y tema en navegador local, persistencia al recargar, ficha y documentos sin desbordamiento a 1440 y 390 px. Las pruebas de edad cubren cumpleaños, 29 de febrero, fecha inválida y futura; las de tema cubren almacenamiento bloqueado y vuelta al diseño actual. Sin despliegue ni edición de expedientes durante QA. La revisión oscura no cubre exhaustivamente todas las rutas.
