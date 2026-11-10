# Tasks

## 1. Base de datos

- [x] 1.1 Migración `employee_credits` (tipo, número, unicidad, RLS RRHH/Nómina, auditoría, `updated_at`, encolado) y `sync_read_snapshot` con `credits`; aplicar en local sin `db:reset` y regenerar tipos.
- [x] 1.2 Prueba SQL revertida: alta, duplicado, número vacío, lectura de Nómina, aislamiento de otros roles, auditoría, encolado y snapshot.

## 2. Frontend

- [x] 2.1 `CreditsSection.vue` y sección «Créditos» para RRHH y Nómina en `EmployeeDetailPage.vue`; etiqueta en el historial.

## 3. Excel

- [x] 3.1 `V_CREDITOS`, portada y pruebas del libro.

## 4. Validación y registro

- [x] 4.1 typecheck, lint, pruebas, build, OpenSpec estricto y revisión en el navegador sin guardar; documentación y `HISTORIAL.md`.
