# Design

## Context

Motivación en `proposal.md`. Estado comprobado en el código:

- `sync_read_snapshot` (última versión en `supabase/migrations/20261102000000_documents_required_by_default.sql`) es la proyección explícita del libro y no lee `employee_sensitive_data`.
- `validateWorkbook` (`server/excel/build-workbook.ts`) rechaza encabezados que coincidan con `FORBIDDEN_HEADER`.
- Los triggers `*_enqueue_sync` de `personnel_model` no incluyen `employee_sensitive_data`, por lo que editarla no encola publicación.
- `private.enqueue_sync()` encola solo destino, revisión, tabla y operación, sin valores de la fila.
- Las vistas de una fila por persona, como `V_CONTACTOS` y `V_CORREOS`, se generan desde `snapshot.employees`.

## Goals / Non-Goals

**Goals:**

- Publicar los seis campos en una sola vista, con el mismo flujo de generación, validación y carga.
- Mantener el libro actualizado cuando cambian estos datos.

**Non-Goals:**

- Cifrar el archivo o proteger hojas con contraseña.
- Administrar desde la aplicación los permisos de SharePoint.
- Cambiar RLS o la pantalla de datos personales.

## Decisions

### Vista separada `V_DATOS_PERSONALES`

Se agrega una hoja visible en lugar de añadir columnas a `V_DIRECTORIO`. El directorio se consulta a diario y mezclarlo con CURP o datos de salud expondría más de lo necesario en pantallas compartidas o capturas. Una hoja oculta se descartó: no protege nada y dificulta la consulta.

### Campos dentro de `snapshot.employees`

La consulta `employees` de `sync_read_snapshot` agrega un `left join` a `employee_sensitive_data`. Así hay una fila por persona, incluidas las que no tienen captura, y `WorkbookSnapshot` no cambia. `01_PERSONAL` y `V_DIRECTORIO` no exponen los campos porque cada hoja declara sus columnas. Se descartó una clave `sensitive` aparte porque obligaría a repetir la unión con personas.

### Migración nueva que redefine la función

Se agrega una migración con `create or replace function`, como hicieron las anteriores, copiando la versión vigente con el único cambio en `employees`. Editar migraciones ya aplicadas se descartó. La misma migración crea `employee_sensitive_data_enqueue_sync`.

### Retiro de `FORBIDDEN_HEADER`

Se elimina la expresión y su comprobación, pues la decisión de negocio cambió. Las exclusiones restantes quedan garantizadas por la proyección explícita y por una prueba que revisa los encabezados de todas las hojas.

### Tipos de celda

`birth_date` usa `kind: 'date'`, que evita el desplazamiento por zona horaria. CURP, RFC, NSS, tipo de sangre y alergias son texto con formato `@`, que conserva ceros iniciales.

## Risks / Trade-offs

- [Acceso mal configurado en SharePoint expone datos sensibles, incluidos datos de salud] → Paso obligatorio en `docs/sharepoint-sync.md` para verificar los permisos del archivo y la biblioteca, incluidos heredados y enlaces compartidos, antes de `SYNC_ENABLED=true`.
- [El historial de versiones y las descargas conservan datos fuera del control de la aplicación] → Documentarlo para que RRHH defina la retención de versiones y el manejo de copias. El cifrado queda fuera de este cambio.
- [`sync_read_snapshot` duplicada puede divergir por error al copiarla] → Comparar con `git diff --no-index` contra la versión anterior y verificar que solo cambia la consulta `employees`.
- [Una prueba o semilla podría introducir datos reales] → Usar solo valores ficticios.

## Migration Plan

1. Aplicar la migración en local sin `db:reset` y comprobar la instantánea mostrando solo claves y conteos, nunca valores.
2. En cada entorno, verificar los permisos del archivo, aplicar la migración y desplegar el backend. La migración debe aplicarse antes: el libro nuevo con la función anterior publicaría columnas vacías.
3. La siguiente publicación, o la republicación diaria, genera la hoja nueva.

**Reversión:** una migración que restaure la función anterior y elimine el trigger, más el despliegue del backend anterior. La siguiente publicación retira la hoja, pero las versiones anteriores del archivo en SharePoint deben depurarse manualmente.
