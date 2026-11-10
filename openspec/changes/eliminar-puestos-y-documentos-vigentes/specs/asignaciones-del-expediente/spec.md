## Purpose

Permitir a RRHH corregir puestos asignados por error, manteniendo trazabilidad y la alternativa de conservar el historial laboral.

## ADDED Requirements

### Requirement: Eliminación confirmada de una asignación

El sistema SHALL permitir a RRHH eliminar una asignación desde Puestos y proyectos, con confirmación explícita y constancia en auditoría, sin eliminar el puesto del catálogo ni el expediente.

#### Scenario: Confirmar o cancelar

- **WHEN** RRHH pulsa Eliminar sobre una asignación
- **THEN** puede cancelar sin cambios o confirmar el borrado de esa asignación y su registro de auditoría.

#### Scenario: Dependencias actualizadas

- **WHEN** se elimina una asignación
- **THEN** se actualizan la tabla de puestos, el puesto de la tarjeta, el directorio y los cursos requeridos, y se encola la proyección Excel.

#### Scenario: Error y permisos

- **WHEN** el servidor rechaza el borrado o el usuario carece del rol RRHH
- **THEN** no se anuncia éxito ni se amplía el acceso; la interfaz muestra el error cuando corresponde.

### Requirement: Cierre conservando historial

El sistema SHALL mantener la edición de fecha de fin para terminar una asignación conservándola como historial.

#### Scenario: Terminar un puesto

- **WHEN** RRHH quiere conservar un puesto anterior
- **THEN** puede editar su fecha de fin sin eliminarlo.
