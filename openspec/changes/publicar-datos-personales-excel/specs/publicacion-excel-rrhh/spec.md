# Spec Delta

## Purpose

Definir qué datos personales contiene el libro de Excel publicado para RRHH, cómo se mantienen actualizados y qué condición de acceso exige su publicación.

## ADDED Requirements

### Requirement: Publicación de datos personales

El libro publicado SHALL incluir una vista visible `V_DATOS_PERSONALES` con una fila por cada persona registrada y las columnas de nombre, fecha de nacimiento, CURP, RFC, NSS, tipo de sangre y alergias.

#### Scenario: Persona con datos capturados

- **WHEN** una persona tiene datos personales capturados y se genera el libro
- **THEN** `V_DATOS_PERSONALES` muestra sus valores en las columnas correspondientes

#### Scenario: Persona sin datos capturados

- **WHEN** una persona no tiene datos personales capturados y se genera el libro
- **THEN** `V_DATOS_PERSONALES` incluye su fila con esas columnas vacías

#### Scenario: Identificador con ceros iniciales

- **WHEN** un NSS comienza con ceros
- **THEN** la celda conserva el valor como texto, con sus ceros iniciales

#### Scenario: Acceso desde la portada

- **WHEN** RRHH abre `V_INICIO`
- **THEN** encuentra un enlace a `V_DATOS_PERSONALES` con la descripción de su contenido

### Requirement: Campos que siguen excluidos

El libro MUST NOT incluir la fotografía del empleado ni las observaciones del expediente.

#### Scenario: Revisión de columnas del libro

- **WHEN** se genera el libro
- **THEN** ninguna hoja contiene columnas de fotografía ni de observaciones del expediente

### Requirement: Actualización tras editar datos personales

El sistema SHALL programar una nueva publicación al crear, modificar o eliminar datos personales de una persona.

#### Scenario: Edición de un dato personal

- **WHEN** RRHH modifica un dato personal y la operación se confirma
- **THEN** queda encolada una publicación que refleja el valor nuevo

#### Scenario: Edición revertida

- **WHEN** la transacción que modifica un dato personal se revierte
- **THEN** no queda encolada ninguna publicación por esa edición

### Requirement: Validación antes de publicar

El sistema MUST reabrir el libro antes de publicarlo y rechazar la publicación si faltan hojas, cambian las columnas esperadas o los conteos no coinciden, incluida `V_DATOS_PERSONALES`. Las columnas de datos personales MUST NOT provocar el rechazo.

#### Scenario: Libro correcto con datos personales

- **WHEN** el libro generado coincide con la instantánea
- **THEN** la validación se aprueba y el libro puede publicarse

#### Scenario: Conteo distinto

- **WHEN** el número de filas de `V_DATOS_PERSONALES` difiere del número de personas de la instantánea
- **THEN** la validación falla, el archivo vigente no se reemplaza y el trabajo queda registrado como fallido

### Requirement: Acceso restringido al archivo

El archivo destino MUST tener el acceso limitado a personal de RRHH autorizado antes de activar la publicación en un entorno. La aplicación SHALL conservar su control de acceso actual: solo RRHH lee datos personales en pantalla.

#### Scenario: Activación en un entorno

- **WHEN** se prepara la activación de la publicación en un entorno
- **THEN** la guía de configuración exige verificar los permisos del archivo y de su biblioteca antes de activar `SYNC_ENABLED`

#### Scenario: Usuario sin rol de RRHH en la aplicación

- **WHEN** un usuario sin rol de RRHH consulta datos personales en la aplicación
- **THEN** el sistema se los sigue negando, sin que la publicación del libro cambie ese permiso

### Requirement: Datos personales fuera de registros técnicos

Los mensajes de la cola, los errores de sincronización y las pruebas del repositorio MUST NOT contener datos personales reales.

#### Scenario: Fallo durante la publicación

- **WHEN** falla la generación, la validación o la carga del libro
- **THEN** el error registrado identifica la hoja o la causa sin incluir valores de datos personales
