# Proposal

## Why

RRHH necesita registrar si cada persona tiene crédito INFONAVIT o FONACOT, porque ambos se descuentan por nómina. Hoy no hay dónde capturarlos en el expediente.

## What Changes

- Nueva sección **Créditos** en el expediente: cada persona puede tener ninguno, uno o varios créditos.
- Por cada crédito se captura solo el **tipo** (INFONAVIT o FONACOT) y el **número de crédito**, ambos obligatorios. No se repite el mismo número del mismo tipo para una persona.
- Permisos como en Datos bancarios: RRHH captura, edita y elimina; Nómina (`payroll`) consulta en solo lectura. Los demás roles no ven la sección.
- Los créditos quedan en el historial de cambios y su edición encola una publicación del Excel.
- Nueva vista visible **`V_CREDITOS`** en el libro publicado: una fila por crédito.

El usuario escribió «FOBAPROA» y confirmó que se refería a **FONACOT**, el crédito para trabajadores que se descuenta por nómina.

## Capabilities

### New Capabilities

- `creditos-del-personal`: captura, permisos y publicación de los créditos INFONAVIT y FONACOT del personal.

### Modified Capabilities

- `publicacion-excel-rrhh`: se agrega la vista `V_CREDITOS`.

## Impact

- **Base de datos:** migración con la tabla `employee_credits`, RLS (RRHH todo, Nómina lectura), auditoría, `updated_at`, encolado y nueva versión de `sync_read_snapshot` con el bloque `credits`. Tipos regenerados.
- **Frontend:** `CreditsSection.vue` y su entrada en `EmployeeDetailPage.vue`; etiqueta en el historial de auditoría.
- **Excel:** `credits.sheet.ts`, registro en `build-workbook.ts` y en la portada.
- Sin despliegue: se aplica y prueba solo en local.
