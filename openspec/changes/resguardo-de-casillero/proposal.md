# Proposal

## Why

RRHH necesita registrar el resguardo de casillero que firma cada persona, con la misma información que las cartas y los acuerdos de confidencialidad. Hoy no hay dónde capturarlo en el expediente.

## What Changes

- Nuevo apartado **Resguardo de casillero** en «Contratos y sedes», con **Fecha de firma** (obligatoria), **Link de SharePoint** (opcional) y observaciones.
- Se reutiliza la tabla `employee_confidentiality_agreements`, que ya guarda documentos firmados por persona con fecha y enlace: se agrega el tipo `Resguardo de casillero`. Hereda RLS (solo RRHH), auditoría, `updated_at` y encolado; RRHH puede agregar, editar y eliminar.
- Nueva vista visible **`V_RESGUARDO_CASILLERO`** en el libro, sin enlace. `V_CONFIDENCIALIDAD` sigue mostrando solo cartas y acuerdos.

## Capabilities

### Modified Capabilities

- `contratos-y-confidencialidad`: se agrega el resguardo de casillero.
- `publicacion-excel-rrhh`: se agrega la vista `V_RESGUARDO_CASILLERO`.

## Impact

- **Base de datos:** migración que amplía el CHECK de `document_kind`. Sin cambios en `sync_read_snapshot`: el bloque `confidentiality` ya incluye todos los tipos y calcula ÚLTIMO por tipo.
- **Frontend:** `EmploymentSection.vue`; etiqueta del historial de auditoría.
- **Excel:** hoja nueva en `experience.sheet.ts`, separación de filas en `build-workbook.ts`, portada y pruebas.
- Sin despliegue: se aplica y prueba solo en local.
