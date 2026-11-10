# Tasks

## 1. Base de datos

- [x] 1.1 Migración: `is_current`, unicidad parcial entre vigentes, trigger de un vigente por persona y tipo para INE y licencia, `add_labor_documents` y `sync_read_snapshot` con el vigente; aplicar en local sin `db:reset` y regenerar tipos.
- [x] 1.2 Prueba SQL revertida: renovación, histórico capturado, eliminación del vigente, duplicado de otro tipo y una sola fila en el snapshot.

## 2. Frontend

- [x] 2.1 INE y licencia sin límite de un registro, con «Vigente»; texto de ayuda; control de documentos solo con vigentes.

## 3. Validación y registro

- [x] 3.1 typecheck, lint, pruebas, build, OpenSpec estricto y revisión en el navegador; documentación y `HISTORIAL.md`.
