# Proposal

## Why

Hoy el Excel de RRHH en SharePoint solo se publica cuando el Cron de Supabase llama a `POST /api/jobs/sync-sharepoint` con `SYNC_JOB_SECRET`. RRHH no tiene forma de publicar al momento, por ejemplo después de una captura urgente o para confirmar que una corrección ya llegó al archivo. El botón «Reintentar» de la pantalla Sincronización solo borra la espera tras un error; la publicación ocurre hasta la siguiente ejecución programada.

En la prueba local del 03/11/2026 la publicación funcionó contra SharePoint (revisión 2221, 2 s), pero hubo que invocarla con `curl` y el secreto del trabajo. Ese secreto no puede llegar al navegador.

## What Changes

- Nueva ruta `POST /api/sync-publish` que valida la sesión de Supabase de quien llama: solo **RRHH** o **Admin**, con perfil activo. No acepta `SYNC_JOB_SECRET` ni lo necesita el navegador.
- La ruta ejecuta del lado del servidor la misma publicación que el trabajo programado (`runSharepointSync`), con los mismos turnos (arrendamiento), validación del libro y registro en `sync_jobs`.
- Antes de publicar, levanta la espera de reintento (igual que «Reintentar»), porque la petición la hace una persona autorizada que quiere el resultado ya.
- Respuesta clasificada para la pantalla: **publicado**, **sin cambios**, **en curso** (otra ejecución tiene el turno), **desactivado** (`SYNC_ENABLED` distinto de `true`) o **error**.
- Botón **«Publicar ahora»** en la pantalla Sincronización, en ambos diseños, con estado de carga, aviso del resultado y actualización inmediata del estado y del historial de ejecuciones.
- «Reintentar» se conserva sin cambios.

Fuera de alcance: registrar qué usuario pidió cada publicación (`sync_jobs` no tiene columna de autor; requeriría migración), publicar desde otras pantallas y cambiar el Cron.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `publicacion-excel-rrhh`: se agrega la publicación bajo demanda por RRHH y Admin. La capacidad la introduce el cambio `publicar-datos-personales-excel`, todavía sin archivar; este delta solo agrega requisitos.

## Impact

- **API:** archivo nuevo `api/sync-publish.ts`; `vercel.json` le asigna `maxDuration` de 60 s como a `api/jobs/sync-sharepoint.ts`.
- **Servidor:** `server/security/authorize-user.ts` pasa a aceptar los roles permitidos (hoy fija `hr`); un servicio pequeño en `server/jobs/` para clasificar el resultado. `runSharepointSync` y las funciones SQL no cambian.
- **Frontend:** `src/features/integrations/` (cliente de la ruta y botón en `SyncStatusPage.vue`).
- **Base de datos:** sin migraciones. Se reutiliza `sync_request_retry`, que ya exige RRHH o Admin.
- **Seguridad:** la ruta usa credenciales de servicio de Supabase y Graph después de comprobar el rol; documentar en `docs/security.md` y `docs/sharepoint-sync.md`.
- **Pruebas:** unitarias de la ruta y de la clasificación del resultado.
