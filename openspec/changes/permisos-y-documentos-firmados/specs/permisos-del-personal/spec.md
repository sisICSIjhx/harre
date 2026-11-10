# Spec Delta

## ADDED Requirements

### Requirement: Registro de permisos

RRHH SHALL registrar permisos con tipo `Días` u `Horas`, fecha de inicio y motivo obligatorios, fecha de término (por omisión, la de inicio) y, solo en permisos por horas, hora de inicio y de término obligatorias. Solo RRHH MUST editar permisos y RRHH y Nómina MUST poder consultarlos; cada cambio MUST quedar en auditoría y encolar la publicación.

#### Scenario: Reglas de la base

- **WHEN** se intenta guardar un término anterior al inicio, horas en un permiso por días o una hora de término no posterior a la de inicio
- **THEN** la base rechaza el registro

#### Scenario: Permiso de un día

- **WHEN** RRHH registra un permiso por días con fecha de inicio y sin fecha de término
- **THEN** se guarda con la fecha de término igual a la de inicio y una duración de 1 día

#### Scenario: Permiso por horas

- **WHEN** RRHH registra un permiso por horas el 10/11/2026 de 09:00 a 11:30
- **THEN** se guarda con ambas horas y su duración se muestra como 2 h 30 min

#### Scenario: Permiso por horas sin horas

- **WHEN** RRHH elige «Horas» y no captura la hora de inicio o de término
- **THEN** el formulario pide las horas y la base rechaza el registro

### Requirement: Permisos en el expediente y vista concentrada

El expediente SHALL incluir la sección «Permisos» con los permisos de la persona. El menú lateral SHALL incluir «Permisos», una vista con los permisos de todo el personal, del más reciente al más antiguo, con filtros por persona y por tipo, desde la cual RRHH MUST poder registrar, editar y eliminar permisos eligiendo a la persona y Nómina MUST poder consultarlos sin editarlos.

#### Scenario: Registro desde la vista concentrada

- **WHEN** RRHH registra en «Permisos» un permiso eligiendo a una persona
- **THEN** el permiso aparece en la vista concentrada y en la sección «Permisos» del expediente de esa persona

#### Scenario: Perfil sin acceso

- **WHEN** un perfil sin RRHH ni Nómina abre la aplicación
- **THEN** no ve «Permisos» en el menú ni en el expediente, y la ruta lo envía a «Sin acceso»

#### Scenario: Consulta de Nómina

- **WHEN** Nómina abre «Permisos» en el menú o en el expediente
- **THEN** ve los permisos sin las acciones Agregar, Editar ni Eliminar, y la base rechaza sus cambios
