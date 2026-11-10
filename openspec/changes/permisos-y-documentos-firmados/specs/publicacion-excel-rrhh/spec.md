# Spec Delta

## ADDED Requirements

### Requirement: Vistas de documentos firmados adicionales y permisos

El libro SHALL incluir las vistas `V_RESGUARDO_VEHICULO` (fecha de firma y ÚLTIMO), `V_ACTAS_ADMINISTRATIVAS` (fecha), `V_PRESTAMOS` (fecha y cantidad en pesos) y `V_PERMISOS` (tipo, inicio, término, horas, días, horas por día y motivo), sin enlaces de SharePoint. `V_CONFIDENCIALIDAD` MUST mostrar solo cartas y acuerdos de confidencialidad, y la portada MUST describir las vistas nuevas.

#### Scenario: Préstamo publicado

- **WHEN** se publica el libro con un préstamo de 5,000
- **THEN** `V_PRESTAMOS` muestra la fecha y la cantidad con formato de moneda, y `V_CONFIDENCIALIDAD` no lo incluye

#### Scenario: Permiso publicado

- **WHEN** se publica el libro con un permiso por horas
- **THEN** `V_PERMISOS` muestra su tipo, fechas, horas y motivo
