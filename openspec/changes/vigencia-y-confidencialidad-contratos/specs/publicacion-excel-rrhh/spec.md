# Spec Delta

## ADDED Requirements

### Requirement: Altas y bajas y contratos en vistas separadas

El libro publicado SHALL incluir `V_ALTAS_BAJAS`, con una fila por alta (EMPLEADO, EMPRESA, INGRESO, ALTA IMSS, BAJA, ESTADO, CENTRO TRABAJO, ÁREA), y `V_CONTRATOS`, con una fila por contrato (EMPLEADO, CONTRATO, INICIO, TÉRMINO, ÚLTIMO). Las fechas MUST quedar vacías cuando no existen. Registrar, editar o borrar un contrato, una carta o un acuerdo MUST encolar una nueva publicación del libro.

#### Scenario: Contrato por meses

- **WHEN** un contrato Por meses del 15/01/2024 al 14/07/2024 se publica
- **THEN** su fila en `V_CONTRATOS` muestra «Por meses» y ambas fechas, sin columnas de confidencialidad, y `V_ALTAS_BAJAS` no lleva columna de contrato

### Requirement: Confidencialidad por persona en el libro

El libro SHALL incluir `V_CONFIDENCIALIDAD`, con una fila por carta o acuerdo (EMPLEADO, DOCUMENTO, FECHA DE FIRMA, ÚLTIMO por persona y tipo, OBSERVACIONES), sin enlace ni contrato. `V_CONCENTRADO` MUST tomar la firma más reciente de cada tipo desde esa vista.

#### Scenario: Dos acuerdos de la misma persona

- **WHEN** una persona tiene acuerdos firmados el 16/01/2024 y el 20/07/2024 y se genera el libro
- **THEN** `V_CONFIDENCIALIDAD` muestra ambos, ÚLTIMO marca el del 20/07/2024, `V_CONCENTRADO` muestra esa fecha y ninguna vista publica el enlace

#### Scenario: Alta de un acuerdo

- **WHEN** RRHH registra un acuerdo de confidencialidad
- **THEN** queda pendiente una nueva publicación del libro
