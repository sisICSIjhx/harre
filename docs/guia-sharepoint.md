# Guía de puesta en marcha — SharePoint

Plan paso a paso para activar las dos integraciones con SharePoint que ya están implementadas pero
**sin probar contra un tenant real**:

- **A. Publicación del Excel** `Personal_ICSI.xlsx` (Supabase → SharePoint, una sola dirección).
- **B. Archivos del expediente** en una carpeta `INICIALES_EXPEDIENTE` por persona.

Son independientes: se pueden activar por separado. La referencia técnica está en
[`sharepoint-sync.md`](sharepoint-sync.md); esta guía solo ordena el trabajo. Marcar cada casilla al
terminar y registrar en `HISTORIAL.md` lo que realmente se verificó.

> No anotar aquí secretos, identificadores reales del tenant ni datos de personas. Los valores van en
> las variables de entorno de Vercel y en Vault de Supabase.

## Estado de partida (2026-11-02)

| Pieza                                        | Estado                                              |
| -------------------------------------------- | --------------------------------------------------- |
| Código de publicación del Excel y cola       | Implementado y probado en local con dobles          |
| Código de archivos del expediente            | Implementado detrás de `VITE_EMPLOYEE_FILES_TARGET` |
| Migraciones (hasta `20261102180000`)         | Aplicadas solo en local                             |
| Proyecto remoto de Supabase                  | No vinculado                                        |
| Despliegue en Vercel                         | No comprobado                                       |
| Registro de aplicación en Entra ID           | No existe                                           |
| Sitio, biblioteca, archivo y carpeta destino | Sin definir                                         |

## Fase 0 — Decisiones ✅ (2026-11-02)

- [x] **Nombre de carpeta:** `INICIALES_EXPEDIENTE`, como está implementado (`RMV_EXPEDIENTE`,
      `RMV_EXPEDIENTE_2` si se repiten). Sin cambios de código.
- [x] **Ubicación:** una **biblioteca nueva, exclusiva de RRHH**, en el sitio de RRHH y sin herencia de
      permisos. El Excel y la carpeta raíz de expedientes van en esa misma biblioteca (mismo drive).
- [x] **Lectores autorizados:** un **grupo de seguridad de RRHH** en Entra ID/Microsoft 365. Las altas
      y bajas de lectores se hacen en el grupo, no en los archivos.
- [x] **Versiones:** la biblioteca conserva **50 versiones**. La depuración manual de versiones y
      copias, si se retira la publicación, la hace quien administra el tenant.
- [x] **Entornos:** publica **solo producción**. Durante las Fases 5 y 6 la vista previa usa
      `SYNC_ENABLED=true` con los destinos de prueba y producción queda en `false`; en la Fase 7 se
      invierte. Dominio: el de Vercel (`<proyecto>.vercel.app`) por ahora; si después se agrega uno
      propio, actualizar la URL del Cron.
- [x] **Responsable del tenant:** el propio usuario del proyecto tiene el rol de administrador y hará
      la Fase 3.

## Fase 1 — Backend desplegado

Ambas integraciones corren en Vercel Functions y leen Supabase remoto.

1. [ ] Crear el proyecto de Supabase y vincularlo: `npx supabase link --project-ref <ref>`.
2. [ ] Aplicar las migraciones con `npx supabase db push`. **No** ejecutar `db:reset` ni la semilla en
       ese proyecto.
3. [ ] Verificar que existe la fila `sync_state` con `target = 'personal-icsi'` (la crea la migración
       `20261101033155`).
4. [ ] Crear los usuarios reales y asignar el rol `hr` a quien corresponda.
5. [ ] Crear el proyecto en Vercel y cargar las variables de Supabase (`VITE_SUPABASE_URL`,
       `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
       `SUPABASE_PUBLISHABLE_KEY`) y un `SYNC_JOB_SECRET` largo y aleatorio. Dejar
       `SYNC_ENABLED=false` y `VITE_EMPLOYEE_FILES_TARGET` vacío.
6. [ ] Desplegar y entrar con un usuario `hr`.

**Hecho cuando:** la aplicación desplegada funciona contra Supabase remoto y
`POST /api/jobs/sync-sharepoint` con el secreto responde `{"status":"disabled"}` (sin el secreto,
`401`).

## Fase 2 — SharePoint preparado

1. [ ] Crear (o elegir) la biblioteca de RRHH y **romper la herencia de permisos**; dar acceso solo a
       los lectores autorizados de la Fase 0. Revisar enlaces compartidos existentes.
2. [ ] Activar el historial de versiones con el límite decidido.
3. [ ] Crear los destinos **de prueba**:
   - un archivo vacío `Personal_ICSI_PRUEBA.xlsx`;
   - una carpeta `EXPEDIENTES_PRUEBA`.
4. [ ] Más adelante (Fase 7) crear los definitivos: `Personal_ICSI.xlsx` y la carpeta raíz de
       expedientes, en el mismo drive.

**Hecho cuando:** una persona sin autorización no puede abrir la biblioteca (probar con una cuenta
ajena a RRHH).

## Fase 3 — Aplicación en Entra ID

1. [ ] Registrar la aplicación (un solo inquilino). Anotar `MS_TENANT_ID` y `MS_CLIENT_ID`.
2. [ ] Crear un secreto de cliente → `MS_CLIENT_SECRET`. Registrar su **fecha de vencimiento** y
       programar la rotación; al vencer, la publicación falla con error permanente.
3. [ ] Agregar el permiso de aplicación de Microsoft Graph **`Sites.Selected`** y dar el consentimiento
       administrativo. No usar `Sites.ReadWrite.All`: daría escritura sobre todo el tenant.
4. [ ] Conceder escritura de la aplicación **solo sobre el sitio de RRHH**. Lo hace un administrador
       (por ejemplo en Graph Explorer, con un permiso como `Sites.FullControl.All` delegado):

   ```http
   POST https://graph.microsoft.com/v1.0/sites/<SP_SITE_ID>/permissions
   Content-Type: application/json

   {
     "roles": ["write"],
     "grantedToIdentities": [
       { "application": { "id": "<MS_CLIENT_ID>", "displayName": "ICSI RRHH" } }
     ]
   }
   ```

   `Sites.Selected` limita a la **aplicación** a ese sitio; no controla quién lee el archivo. Eso lo
   controla la Fase 2.

**Hecho cuando:** `GET /sites/<SP_SITE_ID>/permissions` muestra la aplicación con rol `write`.

## Fase 4 — Identificadores

Obtenerlos con Graph Explorer (cuenta de administrador o de RRHH con acceso):

| Variable                 | Consulta                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `SP_SITE_ID`             | `GET /sites/<tenant>.sharepoint.com:/sites/<ruta-del-sitio>` → `id`       |
| `SP_DRIVE_ID`            | `GET /sites/<SP_SITE_ID>/drives` → `id` de la biblioteca                  |
| `SP_FILE_ITEM_ID`        | `GET /drives/<SP_DRIVE_ID>/root:/<ruta>/Personal_ICSI_PRUEBA.xlsx` → `id` |
| `SP_EMPLOYEES_FOLDER_ID` | `GET /drives/<SP_DRIVE_ID>/root:/<ruta>/EXPEDIENTES_PRUEBA` → `id`        |

- El archivo y la carpeta **deben estar en el mismo drive** (`SP_DRIVE_ID`).
- El código actual usa `SP_DRIVE_ID`, `SP_FILE_ITEM_ID` y `SP_EMPLOYEES_FOLDER_ID`; `SP_SITE_ID` solo
  se necesita para el permiso de la Fase 3, pero conviene guardarlo.

**Hecho cuando:** los cuatro identificadores están cargados en Vercel (entorno de prueba) junto con
`MS_TENANT_ID`, `MS_CLIENT_ID` y `MS_CLIENT_SECRET`.

## Prueba local (opcional, antes de desplegar)

Las Fases 5 y 6 pueden probarse desde el equipo de desarrollo, con la base local y los destinos de
prueba, sin la Fase 1. Graph acepta las credenciales de la aplicación desde cualquier equipo.

1. [ ] Poner todas las variables en **`.env`** (ignorado por Git), no en `.env.local`: `vercel dev`
       solo pasa a las funciones de `/api` el archivo `.env`; `.env.local` lo lee únicamente Vite.
       Incluir `SUPABASE_SECRET_KEY` (de `npx supabase status`), `MS_*`, los `SP_*` **de prueba**,
       `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SYNC_JOB_SECRET`, `SYNC_ENABLED=true` y
       `VITE_EMPLOYEE_FILES_TARGET=sharepoint`. Reiniciar `vercel dev` después de cada cambio.
2. [ ] Encender Docker y `npm run db:start`.
3. [ ] `npx vercel login` y `npx vercel dev`. La primera vez pide vincular la carpeta a un proyecto de
       Vercel; puede ser uno nuevo y vacío (no se despliega nada). `npm run dev` no sirve `/api`.
4. [ ] Publicar el Excel a mano (Fase 5, pasos 2 a 6) con
       `curl -X POST http://localhost:3000/api/jobs/sync-sharepoint -H "Authorization: Bearer <SYNC_JOB_SECRET>"`.
5. [ ] Probar los archivos del expediente desde la aplicación (Fase 6, pasos 2 a 8).

La base local puede contener datos reales importados: publicar solo cuando la biblioteca ya tenga los
permisos de la Fase 2. No se comprueban aquí el Cron ni los tiempos de Vercel (Fase 5, paso 7).

## Fase 5 — Prueba del Excel (destino de prueba)

1. [ ] En el entorno de prueba, `SYNC_ENABLED=true` y `SYNC_TARGET=personal-icsi`. Redesplegar.
2. [ ] Forzar una revisión pendiente (editar a una persona, o
       `select public.sync_mark_dirty('personal-icsi');` en el editor SQL).
3. [ ] Invocar a mano:

   ```bash
   curl -X POST https://<dominio>/api/jobs/sync-sharepoint -H "Authorization: Bearer <SYNC_JOB_SECRET>"
   ```

   Esperado: `{"status":"published","revision":N}`. Una segunda llamada sin cambios: `{"status":"idle"}`.

4. [ ] Abrir `Personal_ICSI_PRUEBA.xlsx` en Excel de escritorio y en Excel en la web: 28 hojas
       visibles, catálogos ocultos, fórmulas de vigencias, `V_LICITACIONES` y `V_CONCENTRADO`
       funcionando, NSS con ceros iniciales, fechas sin desfase.
5. [ ] Revisar la pantalla **Sincronización**: trabajo completado, cola vacía.
6. [ ] Casos de error:
   - **Archivo abierto/bloqueado:** abrirlo en Excel de escritorio, publicar → debe quedar como fallo
     transitorio (`423`/`412`) y reintentarse solo.
   - **Edición manual:** escribir en el archivo y publicar → la edición se pierde (comportamiento
     esperado; comunicarlo a RRHH).
   - **Sin permiso:** revocar temporalmente el permiso de la Fase 3 → fallo permanente (`403`) que
     espera reintento desde Sincronización. Restaurar el permiso y reintentar.
7. [ ] Medir duración y memoria en los registros de Vercel con el volumen real; debe quedar holgado bajo
       los 60 s de `maxDuration`.

**Hecho cuando:** publicación correcta, reintentos comprobados y tiempos anotados en `HISTORIAL.md`.

## Fase 6 — Prueba de archivos del expediente (carpeta de prueba)

1. [ ] En el entorno de prueba, `VITE_EMPLOYEE_FILES_TARGET=sharepoint`. Es variable de compilación:
       **redesplegar** para que tome efecto.
2. [ ] Dar de alta una persona ficticia → se crea `XYZ_EXPEDIENTE` en `EXPEDIENTES_PRUEBA` y queda en
       `employee_sharepoint_folders`.
3. [ ] Alta con iniciales repetidas → `XYZ_EXPEDIENTE_2`.
4. [ ] Subir un PDF, un JPG y la foto de perfil. Si el navegador bloquea el envío a la URL de la sesión
       de subida, es un problema de **CORS**: anotarlo, porque obliga a cambiar el diseño.
5. [ ] Rechazos: un archivo de otro tipo y uno mayor a 10 MB → no se registran y se borran de
       SharePoint.
6. [ ] Abrir un archivo desde la aplicación con un usuario `hr` (usa `web_url`; requiere acceso a la
       biblioteca) y comprobar que un usuario sin acceso no lo abre.
7. [ ] Un archivo cargado antes en Supabase Storage sigue abriendo.
8. [ ] Borrar las personas y carpetas ficticias.

**Hecho cuando:** todos los casos pasan; se marca la tarea 4.3 de
`openspec/changes/ajustes-rrhh-noviembre/tasks.md`.

## Fase 7 — Paso a producción

1. [ ] Crear `Personal_ICSI.xlsx` y la carpeta raíz de expedientes definitiva; obtener sus
       identificadores (Fase 4) y sustituirlos en el entorno de producción.
2. [ ] **Carpetas existentes:** si ya hay carpetas de expediente creadas a mano, moverlas dentro de la
       carpeta raíz y registrarlas (una fila por persona en `employee_sharepoint_folders` con
       `employee_id`, `item_id`, `folder_name`, `web_url`). Sin registro, el sistema creará una carpeta
       nueva con sufijo `_2`.
3. [ ] Programar el Cron en Supabase con Vault (bloque SQL de
       [`sharepoint-sync.md`](sharepoint-sync.md#cron)) y la republicación diaria.
4. [ ] `SYNC_ENABLED=true` **solo** en producción; en cualquier otro entorno, `false` o identificadores
       distintos.
5. [ ] `VITE_EMPLOYEE_FILES_TARGET=sharepoint` en producción y redesplegar.
6. [ ] Primera publicación completa: comprobar el archivo y la pantalla de Sincronización.
7. [ ] Comunicar a RRHH: el Excel es de solo consulta; las capturas se hacen en la aplicación.

**Hecho cuando:** dos ciclos de Cron publican sin intervención y RRHH abre archivos del expediente.

## Fase 8 — Operación

- [ ] Recordatorio de vencimiento de `MS_CLIENT_SECRET`.
- [ ] Revisar mensualmente el crecimiento de la cola, `sync_jobs` y `audit_logs`.
- [ ] Revisar periódicamente permisos y enlaces compartidos de la biblioteca.
- [ ] Para retirar la publicación: `SYNC_ENABLED=false`, desprogramar el Cron y depurar versiones y
      copias a mano.

## Cierre

- [ ] Registrar en `HISTORIAL.md` cada fase completada con lo realmente verificado.
- [ ] Actualizar `docs/CONTEXTO_PROYECTO.md` y la sección "Limitaciones por verificar" de
      `sharepoint-sync.md`.
- [ ] Archivar los cambios OpenSpec `publicar-datos-personales-excel` y `ajustes-rrhh-noviembre`.
