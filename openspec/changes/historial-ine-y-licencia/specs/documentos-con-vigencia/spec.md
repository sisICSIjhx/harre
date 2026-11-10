# Spec Delta

## ADDED Requirements

### Requirement: Histórico de INE y licencia

El sistema SHALL permitir a RRHH registrar varias INE y varias licencias de conducir por persona. Cuando una persona tenga registros de uno de esos documentos, exactamente uno MUST estar marcado como vigente. Los demás tipos de documento MUST conservar un solo registro por persona y tipo. Este requisito sustituye, para INE y licencia, el «Registro único y coherente» del cambio `eliminar-puestos-y-documentos-vigentes`; la validación de fechas y campos se mantiene.

#### Scenario: Renovación

- **WHEN** RRHH agrega una INE a una persona que ya tiene una INE vigente
- **THEN** la nueva queda como vigente y la anterior se conserva con «Vigente: No»

#### Scenario: Captura de un histórico

- **WHEN** RRHH agrega una licencia desmarcando «Vigente» y la persona ya tiene una licencia vigente
- **THEN** la nueva se guarda como histórico y la vigente no cambia

#### Scenario: Eliminación del vigente

- **WHEN** RRHH elimina la INE vigente y quedan otras INE
- **THEN** pasa a vigente la más reciente que quede

#### Scenario: Otros documentos

- **WHEN** se intenta registrar un segundo documento de un tipo distinto de INE o licencia para la misma persona
- **THEN** la base lo rechaza indicando que ya existe un registro con esos datos

### Requirement: Uso del registro vigente

El control de documentos, el semáforo, los conteos de pendientes y `V_DOCUMENTOS` SHALL usar solo el registro vigente de cada persona y tipo. Los registros históricos MUST NOT publicarse en el libro.

#### Scenario: INE renovada en el libro

- **WHEN** una persona tiene una INE vencida histórica y una INE vigente validada y se genera el libro
- **THEN** `V_DOCUMENTOS` muestra una sola fila de INE, con los datos de la vigente
