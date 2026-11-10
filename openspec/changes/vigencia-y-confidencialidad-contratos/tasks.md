# Tasks

## 1. Base de datos

- [x] 1.1 Crear la migración aditiva (vigencia y meses con su restricción, `unique (id, employee_id)`, tabla de confidencialidad con RLS, auditoría y `updated_at`, vista de opciones, tres tipos de documento) y aplicarla en local sin `db:reset`.
- [x] 1.2 Verificar en transacciones revertidas: meses con y sin «Por meses», contrato ajeno rechazado, duplicado por tipo y contrato rechazado.
- [x] 1.3 Regenerar tipos con `npm run db:types`.

## 2. Frontend

- [x] 2.1 Admitir `lookup.filter` en `RecordField`, `RecordEditor` y `RecordForm`.
- [x] 2.2 Mensaje propio para la regla de meses en `record-errors.ts`, con prueba.
- [x] 2.3 Vigencia, meses y tablas de cartas y acuerdos en `EmploymentSection.vue`; etiqueta en el historial.
- [x] 2.4 Bloqueo de traducción en `index.html`.

## 3. Validación y registro

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`.
- [x] 3.2 Verificar en el navegador, en un puerto aparte y sin guardar datos reales, que la sección muestra los campos y las tablas nuevas.
- [x] 3.3 Actualizar `docs/database.md` y `HISTORIAL.md`.

## 4. Publicación en el Excel

- [x] 4.1 Migración con la nueva versión de `sync_read_snapshot` (solo cambia `contracts`) y el trigger de encolado en la tabla de confidencialidad; aplicarla en local sin `db:reset`.
- [x] 4.2 Columnas nuevas en `V_CONTRATOS` y descripción en `V_INICIO`, con prueba del libro.
- [x] 4.3 Verificar la instantánea en la base y generar el libro local con datos ficticios, sin publicar en SharePoint.

## 5. Contrato único con fechas (revisión)

- [x] 5.1 Migración `20261104150000_contract_dates.sql`: opciones de vigencia sumadas a `contract_type`, traslado protegido de vigencia, `contract_start_date` y `contract_end_date` con sus dos restricciones, nueva versión de `sync_read_snapshot` (solo `contracts`) y retiro de `contract_term` y `contract_term_months`; probada en transacción revertida y aplicada en local sin `db:reset`. Tipos regenerados.
- [x] 5.2 `RecordField.visibleWhen` y `section`; `RecordForm` oculta y vacía campos y muestra apartados; pruebas unitarias.
- [x] 5.3 `EmploymentSection.vue`: apartados «Ingreso a la empresa» y «Contrato»; fechas del contrato ocultas con Indeterminado. Mensajes de las restricciones nuevas.
- [x] 5.4 `V_CONTRATOS`: INICIO CONTRATO y TÉRMINO CONTRATO en lugar de VIGENCIA y MESES; prueba del libro.
- [x] 5.5 typecheck, lint, pruebas y revisión en el navegador sin guardar.

## 6. Contratos separados y documentos para todo el personal (revisión)

- [x] 6.1 Migración `20261104170000_separate_contracts.sql`: `employee_contracts` (RLS solo RRHH, auditoría, encolado, restricciones de fechas), traslado de contratos, confidencialidad ligada a `contract_id`, `vw_employee_contract_options`, nueva `sync_read_snapshot` (`employment` y `contracts`), retiro del contrato en `employment_records`, filas de Contrato y confidencialidad para cada persona y trigger para las nuevas. Probada en transacción revertida y aplicada en local sin `db:reset`. Tipos regenerados.
- [x] 6.2 Tablas «Altas y bajas» y «Contratos» en `EmploymentSection.vue`; confidencialidad con contratos de la persona; `RecordEditor.related`; se retira `section`.
- [x] 6.3 `V_ALTAS_BAJAS` y `V_CONTRATOS`, portada y pruebas del libro.
- [x] 6.4 Importación: `Tipo_contrato` crea un contrato.
- [x] 6.5 typecheck, lint, pruebas y revisión en el navegador sin guardar.

## 7. Enlace de SharePoint en la confidencialidad (revisión)

- [x] 7.1 Migración `20261105140000_confidentiality_links.sql`: `contract_id` opcional (se conserva en registros anteriores), `document_url` con restricción http(s) y nueva `sync_read_snapshot` (`contracts` sin confidencialidad y bloque `confidentiality` por persona, sin enlace ni contrato). Aplicada en local con `supabase migration up --local`, sin `db:reset`. Tipos regenerados.
- [x] 7.2 `EmploymentSection.vue`: «Link de SharePoint» opcional en lugar de Contrato en cartas y acuerdos.
- [x] 7.3 `V_CONTRATOS` sin columnas de confidencialidad, nueva `V_CONFIDENCIALIDAD`, `V_CONCENTRADO` y portada; pruebas del libro.
- [x] 7.4 `tests/integration/confidentiality-links.sql` en transacción revertida; typecheck, lint, pruebas y revisión en el navegador sin guardar.
