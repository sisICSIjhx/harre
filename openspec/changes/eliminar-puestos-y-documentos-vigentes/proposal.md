# Proposal

## Why

RRHH necesita corregir asignaciones de puesto registradas por error y capturar los datos particulares de INE y licencia sin mezclarlos. Actualmente la interfaz impide borrar puestos y solo ofrece un control documental genérico.

## What Changes

- Habilitar eliminar la asignación del expediente con confirmación, auditoría y actualización de puesto/cursos; conservar la opción de cerrarla con fecha de fin.
- Añadir «Documentos con vigencia» con apartados INE y licencia, cada uno con formulario propio, fechas y enlace.
- Extender el registro documental existente para conservar una única fuente de fechas y publicar los nuevos datos en su proyección Excel.
- Mantener acceso exclusivo de RRHH y ambos diseños.

## Capabilities

### New Capabilities

- `asignaciones-del-expediente`: eliminación confirmada de asignaciones y actualización de sus vistas dependientes.
- `documentos-con-vigencia`: captura separada de INE y licencia sobre el control documental existente.

### Modified Capabilities

Ninguna spec principal existente cubre estas capacidades.

## Impact

Secciones de empleados, RecordEditor, migración aditiva en employee_document_checklist, tipos Supabase, instantánea SQL y hoja de documentos Excel. Sin nuevas dependencias ni publicación externa automática. Implementación y migración local autorizadas por la solicitud; despliegue externo no comprobado.
