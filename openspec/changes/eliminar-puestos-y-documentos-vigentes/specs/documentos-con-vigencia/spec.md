## Purpose

Facilitar el registro de identificaciones con vencimiento mediante apartados específicos que comparten el control documental del expediente.

## ADDED Requirements

### Requirement: Captura separada por documento

El sistema SHALL ofrecer a RRHH la sección Documentos con vigencia en ambos diseños, con apartados INE y Licencia de conducir, tablas, acciones y formularios independientes.

#### Scenario: INE

- **WHEN** se agrega o edita INE
- **THEN** se ofrecen clave de elector, CIC, OCR, emisión, vencimiento, revisión, enlace y observaciones, sin campos de licencia.

#### Scenario: Licencia

- **WHEN** se agrega o edita licencia
- **THEN** se ofrecen número, tipo, estado de expedición, restricciones y donador de órganos (texto libre opcional), emisión, vencimiento, revisión, enlace y observaciones, sin campos INE.

### Requirement: Registro único y coherente

El sistema SHALL reutilizar el control documental por persona y tipo, preservar datos previos, evitar duplicados y rechazar vencimientos anteriores a la emisión en los dos documentos.

#### Scenario: Registro previo

- **WHEN** ya existe INE o licencia en el control documental
- **THEN** se muestra ese mismo registro para editar y no se ofrece agregar un duplicado.

#### Scenario: Validación de fechas y campos

- **WHEN** se guarda un vencimiento anterior a la emisión o datos exclusivos del otro documento
- **THEN** la base rechaza la captura con un mensaje comprensible.

#### Scenario: Catálogo no disponible

- **WHEN** falla la carga o falta un tipo documental necesario
- **THEN** se informa el problema y no se permite guardar bajo un tipo incorrecto.

### Requirement: Protección y proyección

El sistema SHALL mantener las políticas exclusivas de RRHH, auditoría y encolado existentes; los campos específicos se proyectan a Excel sin publicar enlaces a documentos.

#### Scenario: Guardar y consultar

- **WHEN** RRHH actualiza un documento
- **THEN** su fecha y datos se conservan en el control único, se auditan y quedan disponibles para la siguiente publicación Excel.

#### Scenario: Otros roles

- **WHEN** un usuario sin RRHH consulta estos registros
- **THEN** no ve la sección y la base no entrega sus filas.
