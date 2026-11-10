# Spec Delta

## ADDED Requirements

### Requirement: Vista de créditos

El libro publicado SHALL incluir `V_CREDITOS`, con una fila por crédito (EMPLEADO, ID PERSONA, CRÉDITO, NÚMERO DE CRÉDITO). El número MUST publicarse como texto para conservar ceros iniciales.

#### Scenario: Dos créditos de una persona

- **WHEN** una persona tiene un crédito INFONAVIT y uno FONACOT y se genera el libro
- **THEN** `V_CREDITOS` muestra dos filas con el tipo y el número de cada uno
