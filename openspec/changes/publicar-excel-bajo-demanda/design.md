# Design

## Context

Motivación en `proposal.md`. Estado actual del código:

- `api/jobs/sync-sharepoint.ts` exige `Authorization: Bearer <SYNC_JOB_SECRET>` (`server/security/authorize-job.ts`), revisa `SYNC_ENABLED` y llama a `runSharepointSync(createSharepointSyncDeps(), target)` en `server/jobs/sharepoint-sync.job.ts`. Su `maxDuration` es 60 s (`vercel.json`).
- `runSharepointSync` devuelve `idle` cuando `sync_acquire_lease` no entrega turno. Eso ocurre por tres causas que hoy no se distinguen: no hay cambios (`pending_revision <= published_revision`), otra ejecución tiene el arrendamiento vigente, o `next_attempt_at` está en el futuro (espera de reintento, `infinity` tras error permanente).
- `api/employee-files.ts` ya valida la sesión del usuario con `authorizeHrUser` (`server/security/authorize-user.ts`), que comprueba el token con Supabase Auth y el rol `hr` con perfil activo, pero solo acepta `hr`.
- `sync_request_retry(p_target)` (migración `20261101033157_sync_worker_rpcs.sql`) pone `next_attempt_at = null` y `attempts = 0`. Comprueba en la base que quien llama tenga `hr` o `admin`, y está concedida a `authenticated`.
- La pantalla `src/features/integrations/pages/SyncStatusPage.vue` está restringida a `hr` y `admin` por la ruta (`meta.roles`), y consulta `sync_state` y `sync_jobs` con Vue Query (claves `['sync', 'state']` y `['sync', 'jobs']`).

## Goals / Non-Goals

**Goals:**

- Reutilizar el procesador existente sin cambiar su lógica ni las funciones SQL.
- Distinguir en la respuesta «sin cambios» de «en curso».
- Mantener `src/` sin importar `server/`: el frontend solo llama a la ruta HTTP.

**Non-Goals:**

- Publicación asíncrona con sondeo: la publicación medida en local tarda unos 2 s y cabe en la petición.
- Atribuir la ejecución a un usuario en `sync_jobs`, que requeriría migración.
- Cambiar el comportamiento de `POST /api/jobs/sync-sharepoint`.

## Decisions

### 1. Ruta nueva `api/sync-publish.ts`, separada del trabajo programado

El trabajo programado se autentica con un secreto compartido y la publicación bajo demanda con la sesión del usuario. Mezclar ambos esquemas en una ruta complicaría la autorización y el análisis de seguridad.

- _Alternativa:_ aceptar en `api/jobs/sync-sharepoint.ts` el secreto o una sesión válida. Se descarta para no ampliar la superficie del endpoint del Cron.

### 2. Autorización por roles parametrizada

`authorizeHrUser` se generaliza a `authorizeUser(header, roles)`, con la misma comprobación de token y perfil activo. `api/employee-files.ts` pasa `['hr']` y la ruta nueva `['hr', 'admin']`. Se puede conservar `authorizeHrUser` como envoltura para no tocar las pruebas existentes.

- _Alternativa:_ duplicar la función para Admin. Se descarta por duplicar la comprobación de seguridad.

### 3. Orden de la petición

1. Método `POST`; si no, `405`.
2. `authorizeUser` con `hr` o `admin`; si falla, `401`.
3. `SYNC_ENABLED !== 'true'`: responder `{ status: 'disabled' }` sin tocar la base ni Graph.
4. `sync_request_retry(target)` con el **cliente del usuario**, de modo que la base vuelve a comprobar el rol. Solo levanta la espera; no toca el arrendamiento.
5. `runSharepointSync(createSharepointSyncDeps(), target)`, sin cambios.
6. Si el resultado es `idle`, leer `sync_state` con el cliente administrativo y clasificar: sin cambios pendientes → `up_to_date`; si no → `in_progress` (arrendamiento vigente u otra ejecución que acaba de tomar el turno).

Respuestas: `200` con `published` (y `revision`), `up_to_date`, `in_progress` o `disabled`; `502` con `failed`; `500` con `failed` si falla antes de publicar (configuración o Supabase). El mensaje de error no viaja en la respuesta: queda en `sync_state.last_error`, que la pantalla ya muestra.

- _Alternativa al paso 4:_ actualizar `sync_state` con el cliente administrativo. Se prefiere la función existente porque la base hace cumplir el permiso por su cuenta.

### 4. Servicio con dependencias inyectables

La secuencia de los pasos 4 a 6 vive en `server/jobs/sync-publish.service.ts`, con dependencias (`requestRetry`, `run`, `readState`) inyectables, igual que `SyncDeps`, para probarla sin Supabase ni Graph. `api/sync-publish.ts` solo valida y delega.

### 5. Frontend

- `src/features/integrations/services/sync-publish.api.ts`: obtiene el token con `supabase.auth.getSession()` y llama a `POST /api/sync-publish`, igual que `employee-files.api.ts`.
- `SyncStatusPage.vue`: botón «Publicar ahora» (`pi pi-upload`) junto a «Reintentar», con `useMutation`. Queda deshabilitado mientras la petición está pendiente. Al terminar, aviso según el estado e invalidación de `['sync']`. Textos:
  - `published`: «Excel publicado».
  - `up_to_date`: «El Excel ya está al día».
  - `in_progress`: «Hay una publicación en curso; intenta en unos minutos».
  - `disabled`: «La publicación está desactivada en este entorno».
  - Error: «No se pudo publicar; revisa el estado».
- La pantalla ya está restringida a RRHH y Admin, así que no hace falta otra condición de visibilidad. Ambos diseños usan el mismo componente.

### 6. `vercel.json`

Agregar `"api/sync-publish.ts": { "maxDuration": 60 }`. La regla de reescritura ya excluye `/api/`.

## Risks / Trade-offs

- [Clics repetidos generan publicaciones seguidas] → El arrendamiento impide dos simultáneas, sin cambios no se sube nada y el botón se deshabilita durante la petición.
- [Se ignora un `Retry-After` de Graph tras un 429] → Una persona lo pide de forma explícita. Si Graph vuelve a limitar, el fallo se registra y el reintento se reprograma con su espera.
- [La petición supera los 60 s con mucho volumen] → El arrendamiento (180 s) vence y la siguiente ejecución marca la anterior como interrumpida y reintenta. Medir en la Fase 5 de la guía con el volumen real.
- [No queda registrado quién publicó] → Se acepta por ahora. La función puede registrar en los logs de Vercel el identificador del usuario, sin datos personales.
- [Se levanta un error permanente sin corregir la causa] → Es el mismo efecto que «Reintentar». El nuevo fallo vuelve a quedar visible en la pantalla.

## Migration Plan

Sin migraciones. Se despliega con el resto del frontend y de las funciones. Para revertir, retirar el botón y la ruta. El Cron y «Reintentar» siguen funcionando igual.
