# Tasks

## 1. Autorización por roles

- [x] 1.1 Generalizar `server/security/authorize-user.ts` a `authorizeUser(header, roles, createClient?)` con la misma comprobación de token y perfil activo, conservando `authorizeHrUser` como envoltura de `['hr']`; agregar pruebas unitarias (Admin aceptado cuando se permite, Consulta y Nómina rechazados, perfil inactivo rechazado, sin token rechazado) y verificar con `npm test` que `tests/unit/employee-files.test.ts` sigue pasando sin cambios.

## 2. Servicio y ruta de publicación

- [x] 2.1 Crear `server/jobs/sync-publish.service.ts` con dependencias inyectables (`requestRetry`, `run`, `readState`) que levanta la espera, ejecuta la publicación y clasifica `idle` como `up_to_date` o `in_progress`; verificar con pruebas unitarias de cada resultado (`published`, `up_to_date`, `in_progress`, `failed`) y de que `requestRetry` ocurre antes de `run`.
- [x] 2.2 Crear `api/sync-publish.ts`: `405` para métodos distintos de `POST`, `401` sin sesión o sin rol `hr`/`admin`, `{ status: 'disabled' }` sin llamar a la base ni a Graph cuando `SYNC_ENABLED !== 'true'`, `502`/`500` con `failed` y sin detalle del error; verificar con pruebas al estilo de `tests/unit/sync-endpoint.test.ts`.
- [x] 2.3 Agregar `"api/sync-publish.ts": { "maxDuration": 60 }` a `vercel.json`; verificar con `npx prettier --check vercel.json` y que `vercel dev` responde `401` a `POST /api/sync-publish` sin sesión.
- [x] 2.4 Documentar la ruta y su autorización en `docs/sharepoint-sync.md` y `docs/security.md` (tabla de permisos); verificar que los roles y respuestas documentados coinciden con las pruebas.

## 3. Pantalla Sincronización

- [x] 3.1 Crear `src/features/integrations/services/sync-publish.api.ts` con la llamada autenticada con la sesión, sin importar nada de `server/`; verificar con `npm run lint` (regla de importaciones) y `npm run typecheck`.
- [ ] 3.2 Agregar a `SyncStatusPage.vue` el botón «Publicar ahora», deshabilitado durante la petición, con aviso por resultado e invalidación de `['sync']`; conservar «Reintentar»; verificar en el navegador con `vercel dev` y RRHH: «Excel publicado» con cambios pendientes, «El Excel ya está al día» sin cambios, historial actualizado, en ambos diseños y a 375 px sin desbordamiento.
- [x] 3.3 Actualizar `docs/REDISENO_FRONTEND.md` si la acción tiene estilos propios del nuevo diseño; verificar con `npx prettier --check`.

## 4. Verificación integrada

- [ ] 4.1 Con `vercel dev`, la base local y los destinos de prueba de SharePoint: entrar como Admin y publicar; con `SYNC_ENABLED=false` (lo cambia el usuario en `.env`) ver «La publicación está desactivada»; con un usuario Consulta, `POST /api/sync-publish` responde `401`. Registrar solo lo comprobado.
- [ ] 4.2 Ejecutar `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`, y verificar que pasan.
- [x] 4.3 Registrar en `HISTORIAL.md` motivo, archivos, validaciones realmente ejecutadas y pendientes; verificar el formato con `npx prettier --check HISTORIAL.md`.

## Workflow follow-up

- Archivar después de `publicar-datos-personales-excel`, que introduce la capacidad `publicacion-excel-rrhh`.
- En el primer despliegue, confirmar que la ruta responde y anotar la duración real en `HISTORIAL.md`.
