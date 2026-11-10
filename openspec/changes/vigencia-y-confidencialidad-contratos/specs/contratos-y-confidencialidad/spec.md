# Spec Delta

## Purpose

Registrar los contratos de cada persona en una tabla propia, separada de las altas y bajas, con sus fechas, y las cartas y acuerdos de confidencialidad de cada persona con el enlace del documento en SharePoint; y controlar esos documentos como requeridos para todo el personal.

## ADDED Requirements

### Requirement: Tipo y fechas del contrato

Cada contrato SHALL registrarse en la tabla «Contratos», con tipo obligatorio entre Indeterminado, Determinado, Por meses, Por obra determinada, Por ocasión, Por temporada, Periodo de prueba, Capacitación inicial, Proyecto, Honorarios y Otro, y fechas de inicio y de término opcionales. El término MUST NOT ser anterior al inicio. Un contrato Indeterminado MUST NOT tener fechas, y el formulario MUST ocultarlas.

#### Scenario: Contrato con fechas

- **WHEN** RRHH guarda un contrato Por meses con inicio 01/01/2026 y término 30/06/2026
- **THEN** el contrato se guarda y la tabla muestra el tipo y ambas fechas

#### Scenario: Contrato indeterminado

- **WHEN** RRHH elige Indeterminado en Contrato
- **THEN** el formulario oculta Inicio y Término del contrato y los guarda vacíos

#### Scenario: Fechas con contrato indeterminado

- **WHEN** se intenta guardar un contrato Indeterminado con fecha de inicio
- **THEN** la base lo rechaza con un mensaje que explica que un contrato indeterminado no lleva fechas

#### Scenario: Término anterior al inicio

- **WHEN** RRHH guarda un contrato cuyo término es anterior a su inicio
- **THEN** el sistema lo rechaza con un mensaje que explica la regla

#### Scenario: Fechas opcionales

- **WHEN** RRHH guarda un contrato Determinado sin fechas
- **THEN** el contrato se guarda

### Requirement: Altas y bajas separadas de los contratos

El expediente SHALL mostrar «Altas y bajas» (Empresa, Ingreso, Alta IMSS, Baja, Estado, Centro de trabajo y Área) y «Contratos» como tablas independientes, porque un contrato puede renovarse sin que la persona se dé de baja. Una persona MAY tener varios contratos con una sola alta.

#### Scenario: Renovación de contrato

- **WHEN** RRHH agrega un segundo contrato a una persona que sigue activa
- **THEN** el contrato aparece en «Contratos» y la tabla «Altas y bajas» no cambia

#### Scenario: Contratos existentes

- **WHEN** se aplica la separación y un alta tenía tipo de contrato
- **THEN** ese contrato pasa a «Contratos» con su tipo y sus fechas

### Requirement: Cartas y acuerdos de confidencialidad

El expediente SHALL permitir registrar cartas y acuerdos de confidencialidad, cada uno con fecha de firma obligatoria y «Link de SharePoint» y observaciones opcionales. El enlace MUST iniciar con http:// o https://. Una persona MAY tener varias cartas y varios acuerdos. Solo RRHH lee y edita estos registros, y sus cambios quedan en el historial.

#### Scenario: Registro de una carta

- **WHEN** RRHH agrega una carta de confidencialidad con fecha de firma y el enlace del documento en SharePoint
- **THEN** la carta aparece en la tabla «Cartas de confidencialidad» con la fecha y el enlace «Ver documento», sin pedir contrato

#### Scenario: Carta sin enlace

- **WHEN** RRHH guarda una carta con fecha de firma y sin «Link de SharePoint»
- **THEN** la carta se guarda y el enlace puede agregarse después

#### Scenario: Enlace no válido

- **WHEN** se intenta guardar un acuerdo con un enlace que no inicia con http:// o https://
- **THEN** el formulario y la base lo rechazan

### Requirement: Contrato opcional en la confidencialidad

El formulario de cartas y acuerdos MUST NOT pedir contrato. La base MUST aceptar registros sin contrato y conservar el contrato de los registros anteriores, que MUST pertenecer a la misma persona.

#### Scenario: Registros anteriores con contrato

- **WHEN** se aplica el cambio y una carta ya estaba ligada a un contrato
- **THEN** la carta conserva su contrato y puede editarse para agregar el enlace

### Requirement: Documentos laborales requeridos

El catálogo de documentos SHALL incluir Contrato, Carta de confidencialidad y Acuerdo de confidencialidad con regla General. El control de documentos de cada persona, incluidas las que se den de alta después, MUST contener una fila de cada uno, Requerido y Sin revisar, salvo que RRHH registre otra decisión.

#### Scenario: Personal existente

- **WHEN** RRHH abre el control de documentos de cualquier persona
- **THEN** ve Contrato, Carta de confidencialidad y Acuerdo de confidencialidad como Requerido

#### Scenario: Persona nueva

- **WHEN** RRHH da de alta a una persona
- **THEN** su control de documentos ya incluye los tres documentos

#### Scenario: Captura en el control

- **WHEN** RRHH agrega una fila en Control de documentos
- **THEN** puede elegir Contrato, Carta de confidencialidad o Acuerdo de confidencialidad
