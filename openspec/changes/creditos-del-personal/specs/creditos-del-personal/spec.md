# Spec Delta

## ADDED Requirements

### Requirement: Registro de créditos

El expediente SHALL incluir la sección «Créditos», donde RRHH registra los créditos de cada persona con tipo (INFONAVIT o FONACOT) y número de crédito, ambos obligatorios. Una persona MAY no tener créditos o tener varios. La base MUST rechazar un número vacío y un número repetido del mismo tipo para la misma persona.

#### Scenario: Persona con crédito INFONAVIT

- **WHEN** RRHH agrega un crédito INFONAVIT con su número
- **THEN** el crédito aparece en la tabla «Créditos» con el tipo y el número

#### Scenario: Persona sin créditos

- **WHEN** RRHH abre la sección de una persona sin créditos
- **THEN** ve el aviso «Sin créditos registrados.»

#### Scenario: Número duplicado

- **WHEN** RRHH registra un FONACOT con un número que esa persona ya tiene como FONACOT
- **THEN** el sistema lo rechaza indicando que ya existe un registro con esos datos

### Requirement: Permisos y trazabilidad de créditos

Solo RRHH SHALL capturar, editar y eliminar créditos. Nómina MUST poder consultarlos en solo lectura y los demás roles MUST NOT verlos. Cada cambio MUST quedar en el historial de auditoría y encolar una publicación del libro.

#### Scenario: Consulta de Nómina

- **WHEN** una persona con rol Nómina abre el expediente
- **THEN** ve la sección «Créditos» sin acciones de edición

#### Scenario: Otro rol

- **WHEN** un usuario sin rol RRHH ni Nómina consulta la tabla de créditos
- **THEN** no obtiene registros
