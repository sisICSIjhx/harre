# Design

## Context

Los archivos se suben hoy del navegador a Supabase Storage bajo RLS. SharePoint solo recibe el Excel, con credenciales de servicio desde Vercel Functions. El navegador no puede tener esas credenciales, y RLS no limita lo que hagan.

## Goals / Non-Goals

**Goals:** archivos de cada persona en su carpeta de SharePoint, sin exponer credenciales y sin que un perfil distinto de RRHH pueda usarlas; capturas de catálogo sin cambiar de vista.

**Non-Goals:** migrar a SharePoint los archivos ya cargados en Storage; sincronizar cambios hechos directamente en SharePoint; publicar los enlaces en el Excel.

## Decisions

- **Subida directa con sesión de Graph.** El backend abre una sesión y el navegador envía el archivo a la URL preautorizada. Pasar el archivo por la función chocaría con el límite de cuerpo de Vercel (4.5 MB), inferior a los 10 MB permitidos.
- **El registro se hace al terminar y con datos de SharePoint.** `finish-upload` lee el archivo en Graph, exige que esté en la carpeta de la persona y valida tipo y tamaño. No confía en lo declarado por el navegador. Un archivo inválido se borra; uno de otra carpeta no se toca.
- **Sesión del usuario, no clave de servicio, para la base.** El endpoint usa el token de quien llama, de modo que RLS sigue aplicando y `uploaded_by` queda correcto. Se comprueba el rol `hr` antes de llamar a Graph.
- **Carpetas en tabla aparte.** Escribir en `employees` incrementaría `version` y causaría conflictos con ediciones abiertas.
- **Nombre de carpeta.** Iniciales de nombres y apellidos, sin partículas (DE, LA, DEL...), más `_EXPEDIENTE`. Si ya existe, se agrega `_2`, `_3`. Nunca se reutiliza una carpeta existente: podría ser de otra persona con las mismas iniciales. La carpeta se identifica por su id, así que un cambio de nombre de la persona no la afecta.
- **Activación explícita.** `VITE_EMPLOYEE_FILES_TARGET` conserva el flujo actual hasta tener el sitio configurado, igual que `SYNC_ENABLED`. Sin SharePoint activo no hay fallo en las capturas.
- **Catálogos.** `catalog-fields.ts` es la única definición de campos, compartida por las vistas de catálogo y el alta desde formularios, para que exijan lo mismo.
- **Enlaces.** Solo `http(s)`, validado en el formulario y por `check` en la base: otro esquema, como `javascript:`, se ejecutaría al abrirlo.
- **Filtros y columnas.** Un store de Pinia los conserva al volver de un expediente y se limpia al cerrar sesión. Quitar una columna quita sus filtros, para no filtrar por algo que no se ve. Ubicación sigue la regla de las fechas: exclusiva de RRHH.

## Risks / Trade-offs

- La integración con Graph solo está probada con dobles → verificar contra el sitio real antes de activar la variable, incluido CORS de la URL de sesión.
- Una carpeta creada a mano con el mismo nombre no se reutiliza → la persona queda con sufijo `_2`; si ya existen carpetas, moverlas o registrarlas antes de activar.
- La columna `web_url` abre SharePoint con los permisos del lector → quien no tenga acceso al sitio no podrá abrir el archivo desde la aplicación.
- Si se borra una carpeta en SharePoint, las subidas de esa persona fallan hasta corregir su registro en `employee_sharepoint_folders`.

## Migration Plan

Aplicar la migración, configurar variables y permisos, probar con una persona de prueba y activar `VITE_EMPLOYEE_FILES_TARGET=sharepoint`. Revertir la variable devuelve las subidas a Storage; los archivos ya subidos a SharePoint siguen abriendo mientras exista la configuración de Graph.

## Open Questions

Confirmar con ICSI el sitio y la carpeta raíz de expedientes, y si `INICIALES_EXPEDIENTE` debe llevar la palabra literal, como se implementó, o el número de expediente.
