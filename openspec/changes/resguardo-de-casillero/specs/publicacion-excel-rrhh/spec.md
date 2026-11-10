# Spec Delta

## ADDED Requirements

### Requirement: Vista de resguardos de casillero

El libro publicado SHALL incluir `V_RESGUARDO_CASILLERO`, con una fila por resguardo (EMPLEADO, ID PERSONA, FECHA DE FIRMA, ÚLTIMO, OBSERVACIONES), sin el enlace de SharePoint. `V_CONFIDENCIALIDAD` MUST incluir solo cartas y acuerdos de confidencialidad.

#### Scenario: Persona con resguardo y carta

- **WHEN** una persona tiene una carta de confidencialidad y un resguardo de casillero y se genera el libro
- **THEN** la carta aparece en `V_CONFIDENCIALIDAD` y el resguardo solo en `V_RESGUARDO_CASILLERO`
