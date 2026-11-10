# Spec Delta

## ADDED Requirements

### Requirement: Carpeta de expediente por persona

Con el destino SharePoint activo, el sistema SHALL crear una carpeta `INICIALES_EXPEDIENTE` por persona dentro de la carpeta raíz configurada, al dar de alta a la persona o, si eso falla, al subir su primer archivo. El sistema MUST NOT reutilizar una carpeta existente que no tenga registrada para esa persona.

#### Scenario: Alta de una persona

- **WHEN** RRHH da de alta a Ricardo Molina Villagrán
- **THEN** se crea la carpeta `RMV_EXPEDIENTE` y queda registrada para esa persona

#### Scenario: Iniciales repetidas

- **WHEN** ya existe `RMV_EXPEDIENTE` y otra persona tiene las mismas iniciales
- **THEN** su carpeta se llama `RMV_EXPEDIENTE_2`

#### Scenario: Falla al crear la carpeta

- **WHEN** SharePoint no responde durante el alta
- **THEN** la persona queda guardada, se muestra un aviso y la carpeta se crea al subir el primer archivo

### Requirement: Subida de archivos a SharePoint

Con el destino SharePoint activo, los archivos y la foto de perfil SHALL guardarse en la carpeta de la persona. El sistema SHALL registrar cada archivo con los datos que reporta SharePoint y MUST rechazar tipos distintos de PDF, JPG o PNG y tamaños mayores a 10 MB.

#### Scenario: Subida correcta

- **WHEN** RRHH sube un PDF válido al expediente
- **THEN** el archivo queda en la carpeta de la persona y aparece en la lista de archivos

#### Scenario: Archivo no permitido

- **WHEN** el archivo subido resulta tener un tipo o tamaño no permitido
- **THEN** se borra de SharePoint y no se registra

#### Scenario: Archivo de otra carpeta

- **WHEN** se intenta registrar un archivo que no está en la carpeta de la persona
- **THEN** se rechaza sin modificar ese archivo

### Requirement: Acceso exclusivo de RRHH

El endpoint de archivos MUST exigir una sesión válida con rol `hr` activo antes de usar las credenciales de Microsoft Graph.

#### Scenario: Otro perfil

- **WHEN** un perfil sin rol `hr`, o sin sesión, llama al endpoint
- **THEN** responde 401 sin llamar a Graph

### Requirement: Compatibilidad con archivos anteriores

Los archivos ya guardados en Supabase Storage SHALL seguir abriéndose. Sin el destino SharePoint activo, las subidas SHALL continuar en Supabase Storage.

#### Scenario: Archivo anterior

- **WHEN** RRHH abre un archivo cargado antes del cambio
- **THEN** se abre desde Supabase Storage con una URL firmada
