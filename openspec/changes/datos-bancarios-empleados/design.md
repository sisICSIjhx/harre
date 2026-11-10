# Design

## Context

Motivo y alcance en `proposal.md`; comportamiento en `specs/`.

Estado actual que condiciona el diseño:

- Las secciones del expediente son componentes en `src/features/employees/components/sections/` que configuran `RecordEditor` con una lista de `RecordField` (`src/shared/lib/record-fields.ts`). `RecordEditor` solo permite editar a `hr` y traduce errores de la base con `src/shared/lib/records.ts`.
- Los catálogos con "Añadir" se declaran en `CATALOG_FIELDS` (`src/shared/lib/catalog-fields.ts`).
- Roles en `public.roles` (`admin`, `hr`, `viewer`), asignados por SQL. RLS con `private.has_role()`. Las secciones del expediente tienen política `<tabla>_hr_all`; la lectura general (`employees`, `employee_assignments`, `job_profiles`, `projects`, `courses`, `job_required_courses`, `project_required_courses`, `document_types`, `education_document_rules`, `external_systems`) admite `viewer`.
- Auditoría con `private.audit_row_change()` y encolado con `private.enqueue_sync()`, ambos por trigger. `audit_logs` lo lee `hr` (y `admin` solo para accesos).
- `vw_employee_directory` es `security_invoker` y agrega columnas al final para no romper su contrato.
- El Excel se arma desde `public.sync_read_snapshot` (última versión en `20261102120000_publish_personal_data.sql`) y `server/excel/build-workbook.ts`; `validateWorkbook` ya compara columnas y conteo de cada vista contra el resultado de `layout()`.
- `EmployeeDetailPage.vue` muestra todas las secciones solo a `hr`; las rutas y el menú admiten `hr` y `viewer` en Personal.

## Goals / Non-Goals

**Goals:**

- Una sola migración aditiva, aplicable sin `db:reset`.
- Validación de CLABE idéntica en frontend y base.
- Rol `payroll` sin tocar las políticas existentes.

**Non-Goals:**

- Pantalla de administración de roles; `payroll` se asigna por SQL.
- Importar cuentas desde el libro de RRHH (`scripts/import-rrhh.mjs`).
- Cifrado a nivel de columna; se mantiene el modelo de RLS actual.
- Validar el número de cuenta según cada banco.

## Decisions

### Modelo de datos

Migración `supabase/migrations/<timestamp>_bank_accounts.sql`:

- `insert into public.roles (code, name) values ('payroll', 'Nómina')`.
- `public.banks`: `id`, `name` único, `code` texto único opcional con `check (code ~ '^[0-9]{3}$')`, `is_active`, marcas de tiempo. Semilla con bancos comunes y su clave ABM (por ejemplo `002` Banamex, `012` BBVA, `014` Santander, `021` HSBC, `072` Banorte), verificada contra el catálogo de Banxico antes de aplicar. Son datos públicos, no personales.
- `public.employee_bank_accounts`: `id`, `employee_id` (FK `on delete restrict`), `account_type` con `check in ('Nómina', 'Alternativa')`, `bank_id` (FK), `clabe` texto `not null` con `check (private.is_valid_clabe(clabe))`, `account_number`, `holder_name`, `document_url` con el mismo `check` http(s) de `20261102180000`, `notes`, marcas de tiempo y trigger `set_updated_at`. `unique (employee_id, account_type)` implementa "máximo una de cada tipo".
- `private.is_valid_clabe(text)`: `immutable`; 18 dígitos y dígito verificador con pesos 3, 7, 1 sobre los 17 primeros: `(10 - (Σ (dᵢ·wᵢ mod 10)) mod 10) mod 10`.
- Congruencia banco–CLABE con un trigger `before insert or update` que compara `left(clabe, 3)` con `banks.code` cuando no es nulo y lanza `23514` con `hint = 'clabe_bank_mismatch'`. Se eligió trigger porque un `check` no puede consultar otra tabla.
- Alternativa descartada: guardar la clave del banco derivada de la CLABE sin catálogo. Se descarta porque RRHH necesita poder agregar bancos (SOFIPO, nuevas instituciones) y ver el nombre.

### Permisos

- `employee_bank_accounts`: `employee_bank_accounts_hr_all` (como las demás secciones) y `employee_bank_accounts_payroll_select` (`for select using (private.has_role('payroll'))`).
- `banks`: `banks_select` para `hr`, `viewer` y `payroll` (catálogo, como los demás), y `banks_hr_write`.
- Lectura general para Nómina: políticas nuevas `<tabla>_payroll_select` en las diez tablas que hoy admiten `viewer`. Son permisivas y se suman a las existentes, así que no se reescribe ni se arriesga ninguna política actual. Alternativa descartada: redefinir `private.has_role('viewer')` para incluir `payroll`; mezclaría roles y afectaría cualquier política futura.
- `audit_logs` no cambia: Nómina no lo lee.

### Directorio y filtro

- `vw_employee_directory` se recrea con una columna final `has_payroll_account`: `case when private.has_role('hr') or private.has_role('payroll') then exists (...) end`. Para `viewer` llega `null`, en lugar de un `false` engañoso producido por RLS.
- `EmployeeFilters` agrega `withoutPayrollAccount: boolean`; el store y el repositorio del directorio lo aplican como `employment_status = 'active' and has_payroll_account = false`, junto con los demás filtros. El panel de filtros lo muestra solo a `hr` y `payroll`.

### Frontend

- `RecordField.type` agrega `'clabe'`, con esquema zod que exige 18 dígitos y usa `isValidClabe()` de `src/shared/lib/clabe.ts` (función pura, probada aparte). El campo se muestra completo; no se enmascara en pantalla para RRHH y Nómina.
- `records.ts`: `fail()` reconoce `hint = 'clabe_bank_mismatch'` y muestra "La CLABE no corresponde al banco elegido". El resto de códigos conserva su mensaje.
- `catalog-fields.ts`: `bankFields` y `CATALOG_FIELDS.banks`.
- `BankAccountsSection.vue`: `RecordEditor` sobre `employee_bank_accounts` (tipo, banco con `lookup` a `banks`, CLABE, número de cuenta, titular, comprobante, observaciones) y un `Message` de aviso cuando la persona está activa y no hay cuenta de Nómina. Lee las cuentas con la misma `queryKey` que `RecordEditor`, así que no duplica la consulta.
- `EmployeeDetailPage.vue`: cada sección declara los roles que la ven; Datos bancarios para `hr` y `payroll`, el resto solo `hr`. La edición sigue limitada a `hr` dentro de `RecordEditor`.
- Rutas `personal` y `personal/:id` y el enlace Personal del menú admiten `payroll`. Capacitación, Catálogos y demás siguen sin él.
- `AuditHistoryPage.vue`: etiquetas para `banks` y `employee_bank_accounts`.

### Excel

- Triggers `_audit` y `_enqueue_sync` en `banks` y `employee_bank_accounts`.
- `sync_read_snapshot` se redefine (copia de la versión vigente más la clave `bank_accounts`): unión de las cuentas (`full_name`, `status`, `account_type`, banco, `clabe`, `account_number`, `holder_name`, `control_note` vacío) y de las personas activas sin cuenta de Nómina (`control_note = 'Sin cuenta de nómina'`), ordenada por nombre y tipo. Sin `document_url` ni `notes`.
- `WorkbookSnapshot.bank_accounts`, `bankAccountsSheet` (`V_DATOS_BANCARIOS`, columnas CLABE y cuenta como texto) registrada en `layout()` y en `VIEWS` de `home.sheet.ts`. `validateWorkbook` cubre el conteo sin cambios porque recorre todas las vistas de `layout()`.

## Risks / Trade-offs

- [Datos financieros en el Excel] → La biblioteca exclusiva de RRHH y el grupo de seguridad decididos en la Fase 0 de `docs/guia-sharepoint.md` son condición para activar la publicación; se documenta en `docs/sharepoint-sync.md`.
- [Historial con CLABE en claro] → `audit_logs` ya está limitado a `hr`; se mantiene así y se documenta en `docs/security.md`.
- [Nómina ve todo lo que ve `viewer`] → Aceptado por decisión del usuario. Si después se quiere restringir, basta con retirar las políticas `_payroll_select` correspondientes.
- [Clave ABM equivocada en la semilla] → Bloquearía cuentas válidas. Se verifica contra Banxico antes de aplicar, y RRHH puede corregir la clave en Catálogos.
- [`sync_read_snapshot` redefinida por completo] → Riesgo de perder cambios de la versión anterior. Se parte de la versión vigente y se compara con `git diff --no-index` para confirmar que solo se agrega `bank_accounts`.

## Migration Plan

1. Aplicar la migración en local sin `db:reset` y regenerar tipos (`npm run db:types`).
2. En el remoto, cuando exista (Fase 1 de la guía de SharePoint), se aplica con `supabase db push` junto con las demás migraciones.
3. Asignar `payroll` por SQL a quien corresponda.
4. Reversión: retirar sección, filtro y rol en el frontend y, en base, una migración que elimine triggers, políticas, la columna de la vista, las tablas y el rol, y restaure la versión anterior de `sync_read_snapshot`.

## Open Questions

- Lista final de bancos de la semilla: se puede ampliar después desde Catálogos sin cambiar el diseño.
