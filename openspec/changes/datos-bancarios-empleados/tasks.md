# Tasks

## 1. Base de datos

- [x] 1.1 Crear la migración con el rol `payroll`, `private.is_valid_clabe`, `banks` (con semilla de claves verificadas contra Banxico), `employee_bank_accounts`, trigger de congruencia banco–CLABE, `set_updated_at`, auditoría y encolado; aplicarla en local sin `db:reset` y verificar con `select` que existen tablas, rol y triggers.
- [x] 1.2 Agregar las políticas: `hr_all` y `payroll_select` en cuentas, lectura y escritura de `banks`, y `<tabla>_payroll_select` en las diez tablas de lectura general; verificar en `pg_policies` que ninguna política anterior cambió.
- [x] 1.3 Recrear `vw_employee_directory` con `has_payroll_account` al final y redefinir `sync_read_snapshot` con `bank_accounts`; verificar con `git diff --no-index` contra la versión vigente que solo se agrega lo previsto.
- [x] 1.4 Verificar en la base local, dentro de transacciones revertidas y con datos ficticios: CLABE válida aceptada, longitud y dígito verificador rechazados, banco incongruente rechazado con `clabe_bank_mismatch`, segunda cuenta de Nómina rechazada, edición encola un mensaje y queda en `audit_logs`.
- [x] 1.5 Verificar permisos con usuarios locales de prueba `hr`, `viewer` y `payroll`: Nómina lee cuentas y datos generales y no puede escribir; no lee domicilios, `employee_sensitive_data` ni `audit_logs`; `viewer` no lee cuentas y recibe `has_payroll_account` nulo.
- [x] 1.6 Regenerar tipos con `npm run db:types` y verificar con `npm run typecheck`.

## 2. Validación y catálogo en el frontend

- [x] 2.1 Crear `src/shared/lib/clabe.ts` con `isValidClabe` y pruebas unitarias (válida, ceros iniciales, longitud, letras, dígito incorrecto); verificar con `npm test`.
- [x] 2.2 Agregar el tipo `'clabe'` a `RecordField` y su esquema; verificar con una prueba del esquema.
- [x] 2.3 Reconocer `clabe_bank_mismatch` en `records.ts` con su mensaje; verificar con una prueba.
- [x] 2.4 Agregar `bankFields` a `CATALOG_FIELDS` y la pestaña Bancos en Catálogos; verificar en el navegador el alta de un banco desde Catálogos y desde el campo con "Añadir".

## 3. Expediente y permisos de interfaz

- [x] 3.1 Crear `BankAccountsSection.vue` con el aviso "Sin cuenta de nómina" para personas activas; verificar en el navegador con una persona de prueba activa e inactiva.
- [x] 3.2 Declarar roles por sección en `EmployeeDetailPage.vue` y admitir `payroll` en rutas y menú de Personal; verificar en el navegador con el usuario `payroll`: ve Datos generales y Datos bancarios sin botones de edición y el menú solo muestra Personal.
- [x] 3.3 Agregar el filtro "Sin cuenta de nómina" al store y al panel de filtros, visible para `hr` y `payroll`; verificar con una prueba del store y en el navegador, también que `viewer` no lo ve.
- [x] 3.4 Agregar etiquetas de `banks` y `employee_bank_accounts` en el historial; verificar en el navegador que un cambio de CLABE aparece con autor y fecha.

## 4. Excel

- [x] 4.1 Agregar `bank_accounts` a `WorkbookSnapshot`, crear `V_DATOS_BANCARIOS`, registrarla en `layout()` y en la portada; verificar con `tests/integration/build-workbook.test.ts`: 20 vistas, dos filas para dos cuentas, marca para persona activa sin nómina, ninguna para inactiva, ceros iniciales en CLABE, sin comprobante ni observaciones, enlace en `V_INICIO` y fallo de validación con conteo distinto, usando solo datos ficticios.
- [x] 4.2 Generar el libro en memoria desde la base local y verificar que `validateWorkbook` lo aprueba, sin guardar el archivo.

## 5. Documentación y cierre

- [x] 5.1 Actualizar `docs/database.md`, `docs/security.md` (rol `payroll`, CLABE en historial) y `docs/sharepoint-sync.md` (20 vistas, datos bancarios publicados y excluidos); verificar con `rg` que no quedan conteos o políticas contradictorias.
- [x] 5.2 Ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run spec:check` y `npx openspec validate datos-bancarios-empleados --strict`, y confirmar que pasan.
- [x] 5.3 Agregar la entrada en `HISTORIAL.md` con motivo, alcance, validaciones realmente ejecutadas y pendientes, sin datos personales ni bancarios.

## Workflow follow-up

- Archivar después de `publicar-datos-personales-excel`, que crea la capacidad `publicacion-excel-rrhh` a la que este cambio agrega requisitos.
- Asignar el rol `payroll` por SQL en el entorno remoto cuando exista.
