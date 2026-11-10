# Proposal

## Why

El Excel de RRHH omite hoy los datos personales, y el usuario confirmó que deben incluirse porque el archivo estará en una ubicación que solo verá el personal de RRHH autorizado. Sin ellos, RRHH debe consultar esos campos persona por persona en la aplicación.

## What Changes

- **BREAKING (política de datos):** el libro publica los seis campos de la sección "Datos personales": fecha de nacimiento, CURP, RFC, NSS, tipo de sangre y alergias. Hasta ahora, la documentación, una prueba y la validación del libro prohibían estos datos.
- Nueva vista visible `V_DATOS_PERSONALES`, con una fila por persona, enlazada desde `V_INICIO`.
- La validación previa a publicar deja de rechazar estas columnas y sigue comprobando hojas, columnas y conteos.
- Editar datos personales pasa a generar una nueva publicación. Comprobado en las migraciones: `employee_sensitive_data` no tiene hoy trigger de encolado.
- Siguen sin publicarse la fotografía y las observaciones del expediente.

## Capabilities

### New Capabilities

- `publicacion-excel-rrhh`: contenido del libro publicado para RRHH respecto a datos personales, su actualización y las condiciones de acceso al archivo.

### Modified Capabilities

Ninguna: la única spec existente, `contexto-y-trazabilidad`, no trata el contenido del libro. Su prohibición de registrar datos personales en historial y specs sigue vigente.

## Impact

- **Base de datos:** nueva migración que redefine `sync_read_snapshot` y agrega el trigger de encolado.
- **Backend:** `server/excel/build-workbook.ts`, `server/excel/sheets/employees.sheet.ts`, `server/excel/sheets/home.sheet.ts`.
- **Pruebas:** `tests/integration/build-workbook.test.ts`.
- **Documentación:** `docs/sharepoint-sync.md`, `docs/architecture.md`, comentario de `supabase/seed.sql`, `HISTORIAL.md`.
- **Operación:** el acceso al archivo en SharePoint no lo controla esta aplicación. Debe limitarse a RRHH autorizado antes de activar `SYNC_ENABLED`. La configuración real de SharePoint no se ha verificado; `docs/sharepoint-sync.md` indica que Graph no se ha probado contra un tenant real.
- **Sin cambios:** RLS de `employee_sensitive_data` y frontend. `src/` sigue sin importar `server/`.
