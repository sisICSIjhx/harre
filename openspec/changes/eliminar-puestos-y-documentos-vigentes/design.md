# Design

## Context

JobProfileSection deshabilita un borrado que employee_assignments ya permite mediante RLS hr_all. Los triggers de auditoría y encolado ya cubren DELETE. RecordEditor confirma y refresca las claves employees y records. employee_document_checklist conserva una fila por persona/tipo, con fechas, revisión, enlace y notas; DOC-014 es INE y DOC-012 licencia.

## Goals / Non-Goals

Objetivo: captura fácil siguiendo EmploymentSection, con tablas separadas y persistencia compartida. No se elimina el puesto del catálogo ni se cambia la baja laboral. No se añaden alertas automáticas ni verificación legal de las identificaciones.

## Decisions

- Añadir columnas opcionales ine_elector_key, ine_cic, ine_ocr, license_number, license_type y license_state a employee_document_checklist. Reutilizar issued_on/expires_on evita dos fuentes de vigencia y conserva los registros existentes. Dos tablas nuevas obligarían a sincronizar copias innecesariamente.
- ExpiringDocumentsSection consulta document_types por códigos estables y monta un RecordEditor por tipo, con filtro de empleado y tipo fijado. maxRecords=1 impide ofrecer altas duplicadas; la restricción única resuelve carreras. Errores y tipos ausentes se presentan por apartado.
- Formulario propio por tipo con campos comunes de revisión y evidencia. Datos opcionales para expedientes incompletos; las fechas se capturan DD/MM/AAAA. Renovar consiste en editar el registro documental actual, como en el control existente.
- Trigger invocador valida únicamente los dos códigos y rechaza campos incompatibles y fechas invertidas en capturas nuevas, sin reescribir datos previos. RLS y permisos existentes permanecen. Un cambio de tipo con datos específicos requiere vaciarlos primero.
- Habilitar borrado de asignaciones con texto de confirmación específico. Eliminar no altera catálogos. Conservar instrucciones para cerrar un puesto con fecha.
- Extender sync_read_snapshot desde su última definición y añadir columnas al final de V_DOCUMENTOS para preservar posiciones de columnas previas y fórmulas. No proyectar enlaces.

## Risks / Trade-offs

- Datos previos con fechas incompletas → no se vuelven obligatorias y no se migran valores.
- Dos editores sobre la misma tabla → filtros por empleado/tipo, invalidación de toda la tabla y restricción única.
- Modelo por documento vigente → no crea historial de renovaciones independiente; auditoría conserva los cambios como ya ocurre en el control.
- Base remota sin migrar → aplicar migración antes de desplegar frontend; no afirmar despliegue externo.

## Migration Plan

Aplicar migración aditiva a la base local con migration up, sin reset ni semillas. Regenerar tipos. Verificar reglas, aislamiento y auditoría con datos ficticios en transacción revertida. Publicar base, aplicación y trabajador juntos al desplegar. Reversión del frontend es compatible con las columnas opcionales; conservarlas evita pérdida de capturas.
