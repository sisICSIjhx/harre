# Spec Delta

## ADDED Requirements

### Requirement: Publicación de datos bancarios

El libro publicado SHALL incluir una vista visible `V_DATOS_BANCARIOS` con una fila por cuenta bancaria registrada y las columnas de nombre, estatus, tipo de cuenta, banco, CLABE, número de cuenta, titular y observación de control. El libro MUST NOT incluir el enlace al comprobante ni las observaciones capturadas de la cuenta.

#### Scenario: Persona con dos cuentas

- **WHEN** una persona tiene cuenta de Nómina y Alternativa y se genera el libro
- **THEN** `V_DATOS_BANCARIOS` muestra dos filas para ella, una por cada tipo

#### Scenario: CLABE con ceros iniciales

- **WHEN** una CLABE o un número de cuenta comienzan con ceros
- **THEN** la celda conserva el valor como texto, con sus ceros iniciales

#### Scenario: Acceso desde la portada

- **WHEN** RRHH abre `V_INICIO`
- **THEN** encuentra el enlace a `V_DATOS_BANCARIOS` con su descripción

### Requirement: Marca de cuenta de nómina faltante en el libro

Por cada persona con estatus Activo sin cuenta de tipo Nómina, `V_DATOS_BANCARIOS` SHALL incluir una fila con su nombre y estatus, las columnas de cuenta vacías y la observación de control "Sin cuenta de nómina". Las personas que no están activas MUST NOT recibir esa marca.

#### Scenario: Persona activa sin cuentas

- **WHEN** una persona activa no tiene ninguna cuenta y se genera el libro
- **THEN** aparece una fila con su nombre, la marca "Sin cuenta de nómina" y las columnas de cuenta vacías

#### Scenario: Persona activa con solo cuenta alternativa

- **WHEN** una persona activa solo tiene cuenta Alternativa
- **THEN** aparecen su fila de cuenta Alternativa y una fila adicional con la marca "Sin cuenta de nómina"

#### Scenario: Persona inactiva sin cuentas

- **WHEN** una persona inactiva no tiene cuentas
- **THEN** no aparece en `V_DATOS_BANCARIOS`

### Requirement: Actualización por cambios bancarios

Dar de alta, modificar o eliminar una cuenta bancaria o un banco SHALL generar una publicación pendiente del libro, igual que las demás tablas que lo alimentan.

#### Scenario: Corrección de CLABE

- **WHEN** RRHH corrige la CLABE de una cuenta
- **THEN** queda pendiente una publicación y la siguiente ejecución publica el valor corregido

### Requirement: Validación del libro con datos bancarios

Antes de publicar, la validación del libro MUST comprobar que `V_DATOS_BANCARIOS` tiene tantas filas como cuentas más personas activas sin cuenta de nómina, y SHALL fallar si el conteo no coincide.

#### Scenario: Conteo distinto

- **WHEN** el libro generado tiene en `V_DATOS_BANCARIOS` un número de filas distinto al esperado
- **THEN** la validación falla y no se publica
