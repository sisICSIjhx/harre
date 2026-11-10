# Tasks

## 1. Base de datos

- [x] 1.1 Migración `20261104190000_complete_workbook.sql` con la nueva versión de `sync_read_snapshot` (columnas faltantes, ID PERSONA en cada bloque por persona, bloques `emails`, `contacts` y `work_sites`); probada en transacción revertida y aplicada en local sin `db:reset`.

## 2. Libro

- [x] 2.1 Completar las vistas existentes y agregar `V_SEDES`, `V_CURSOS`, `V_PERFILES`, `V_CAT_DOCUMENTOS` y `V_SISTEMAS`.
- [x] 2.2 `V_CONCENTRADO` con fórmulas por ID PERSONA y resultados en caché; enlace y descripciones en `V_INICIO`.
- [x] 2.3 Validación del libro incluye las vistas nuevas y el número de empleado del concentrado.

## 3. Validación y registro

- [x] 3.1 Pruebas del libro (vistas, observaciones, exclusiones, concentrado) con datos ficticios.
- [x] 3.2 `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run spec:check`.
- [x] 3.3 Generar el libro con la instantánea local sin publicar en SharePoint y revisar que cada rango del concentrado apunta a la columna correcta.
- [x] 3.4 Actualizar `docs/sharepoint-sync.md`, `docs/architecture.md`, `docs/database.md`, `docs/guia-sharepoint.md` y `HISTORIAL.md`.
- [x] 3.6 `V_NUM_EMPLEADO` con el número activo de Interno RRHH, Nómina y Checador por persona; los tres números en `V_CONCENTRADO`; la clave de persona se rotula ID PERSONA (no es número de empleado).
- [ ] 3.5 Abrir el libro publicado en Excel de escritorio y en la web y comprobar que `V_CONCENTRADO` recalcula sin errores.
