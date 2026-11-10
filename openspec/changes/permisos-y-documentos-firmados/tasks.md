# Tasks

## 1. Base de datos

- [x] 1.1 Migración: tipos nuevos en `document_kind`, columna `amount` con CHECK, tabla `employee_leave_permits` (CHECK, término por omisión, triggers, RLS) y `sync_read_snapshot` con `amount` y `permits`; aplicar en local sin `db:reset`, probar reglas y regenerar tipos.

## 2. Frontend

- [x] 2.1 Campos `time` y `money`, obligatoriedad condicionada a la visibilidad y validación entre campos en el editor genérico.
- [x] 2.2 Apartados de resguardo de vehículo, actas administrativas y préstamos en `EmploymentSection.vue`.
- [x] 2.3 Sección «Permisos» del expediente, página `/permisos` con filtros, menú y etiquetas de auditoría.

## 3. Excel

- [x] 3.1 Vistas `V_RESGUARDO_VEHICULO`, `V_ACTAS_ADMINISTRATIVAS`, `V_PRESTAMOS` y `V_PERMISOS`, filtro de `V_CONFIDENCIALIDAD`, portada y pruebas.

## 4. Validación y registro

- [x] 4.1 typecheck, lint, pruebas, build, OpenSpec estricto y revisión en el navegador; documentación y `HISTORIAL.md`.
