# Spec Delta

## ADDED Requirements

### Requirement: Resguardo de casillero

La sección «Contratos y sedes» del expediente SHALL incluir el apartado «Resguardo de casillero», donde RRHH registra cada resguardo con fecha de firma obligatoria, enlace de SharePoint opcional y observaciones. RRHH MUST poder editarlo y eliminarlo con confirmación; los demás roles MUST NOT verlo. Cada cambio MUST quedar en el historial de auditoría y encolar una publicación del libro.

#### Scenario: Resguardo con enlace

- **WHEN** RRHH agrega un resguardo de casillero con fecha de firma y enlace de SharePoint
- **THEN** aparece en el apartado «Resguardo de casillero» con la fecha y el enlace «Ver documento»

#### Scenario: Persona sin resguardo

- **WHEN** RRHH abre «Contratos y sedes» de una persona sin resguardo
- **THEN** ve el aviso «Sin resguardos de casillero registrados.»

#### Scenario: Tipo no válido

- **WHEN** se intenta guardar un documento firmado con un tipo distinto de carta, acuerdo o resguardo de casillero
- **THEN** la base lo rechaza
