# Proposal

## Why

Hoy cada persona tiene un solo registro de INE y uno de licencia de conducir: para renovarlos hay que sobrescribir el anterior y se pierde el histórico. RRHH necesita conservar la identificación vencida y agregar la nueva como la vigente.

## What Changes

- INE y licencia de conducir admiten **varios registros por persona**; exactamente uno es el **vigente** cuando hay registros.
- Al **agregar** una INE o licencia, la nueva queda como vigente y la anterior se conserva como histórico. RRHH puede marcar otro registro como vigente (por ejemplo, al capturar una identificación antigua) y eliminar registros; si se elimina el vigente, pasa a vigente el más reciente que quede.
- Los demás documentos siguen con un solo registro por persona y tipo.
- «Control de documentos», el semáforo, los conteos de pendientes y `V_DOCUMENTOS` usan solo el registro vigente. Los históricos no se publican en el Excel.

## Capabilities

### Modified Capabilities

- `documentos-con-vigencia`: el registro único de INE y licencia pasa a histórico con un vigente.

## Impact

- **Base de datos:** migración con `is_current` en `employee_document_checklist`, unicidad parcial (persona, tipo) entre vigentes, regla de un vigente por persona y tipo para INE y licencia (trigger), `add_labor_documents` con el nuevo `on conflict` y `sync_read_snapshot` que une solo el vigente. Tipos regenerados.
- **Frontend:** `ExpiringDocumentsSection.vue` y sus campos (sin límite de un registro, columna y campo «Vigente»); `DocumentsSection.vue` filtra los vigentes.
- Sin despliegue: se aplica y prueba solo en local.
