# Spec Delta

## ADDED Requirements

### Requirement: Resguardo de vehículo, actas administrativas y préstamos

La sección «Contratos y sedes» del expediente SHALL incluir los apartados «Resguardo de vehículo» (fecha de firma obligatoria), «Actas administrativas» (fecha obligatoria) y «Préstamos» (cantidad y fecha obligatorias), todos con Link de SharePoint opcional y observaciones. Solo RRHH MUST poder verlos, agregarlos, editarlos y eliminarlos con confirmación. Cada cambio MUST quedar en el historial de auditoría y encolar una publicación del libro.

#### Scenario: Préstamo con cantidad

- **WHEN** RRHH agrega un préstamo con cantidad 5,000, fecha y enlace
- **THEN** aparece en «Préstamos» con la cantidad en pesos, la fecha y el enlace «Ver documento»

#### Scenario: Préstamo sin cantidad

- **WHEN** se intenta guardar un préstamo sin cantidad o con cantidad cero o negativa
- **THEN** el formulario lo impide y la base lo rechaza

#### Scenario: Cantidad fuera de préstamos

- **WHEN** se intenta guardar una cantidad en un documento que no es préstamo
- **THEN** la base lo rechaza
